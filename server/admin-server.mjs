import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import multer from "multer";
import { queueBuild, getBuildState } from "./lib/build-queue.mjs";
import { createContentStore } from "./lib/content-store.mjs";
import { loadEnv } from "./lib/env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

loadEnv(rootDir);

const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const trustProxy = process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true";
const credentials = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "playtrix"
};
const usingFallbackCredentials = !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET || "replace-this-session-secret";
const sessionCookieName = "the_catholic_experiment_admin";
const loginWindowMs = 15 * 60 * 1000;
const loginLockoutMs = 15 * 60 * 1000;
const maxLoginAttempts = 6;
const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const loginThrottle = new Map();

const store = createContentStore(rootDir);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const app = express();

app.disable("x-powered-by");

if (trustProxy) {
  app.set("trust proxy", 1);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "2mb" }));
app.use(
  session({
    name: sessionCookieName,
    secret: sessionSecret,
    proxy: trustProxy,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      maxAge: 12 * 60 * 60 * 1000
    }
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.path === "/admin" || req.path === "/login" || req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  next();
});

app.use("/admin/static", express.static(path.join(rootDir, "admin", "static")));

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  next();
}

function requirePageAuth(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
    return;
  }

  next();
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function cleanStringList(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => cleanString(value))
    .filter(Boolean);
}

function cleanObjectList(values, keys) {
  return (Array.isArray(values) ? values : [])
    .map((value) =>
      Object.fromEntries(keys.map((key) => [key, cleanString(value?.[key])]))
    )
    .filter((value) => Object.values(value).some(Boolean));
}

function createId(value, fallback) {
  const stem = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return stem || fallback;
}

function createCsrfToken() {
  return crypto.randomBytes(24).toString("hex");
}

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = createCsrfToken();
  }

  return req.session.csrfToken;
}

function requireCsrf(req, res, next) {
  const expected = ensureCsrfToken(req);
  const supplied = cleanString(req.get("x-csrf-token") || req.body?._csrf);

  if (!safeEqual(supplied, expected)) {
    res.status(403).json({ error: "Invalid request token." });
    return;
  }

  next();
}

function getClientKey(req) {
  return req.ip || "unknown";
}

function pruneLoginThrottle(now = Date.now()) {
  for (const [key, value] of loginThrottle.entries()) {
    if (!value.lockedUntil && now - value.firstAttemptAt > loginWindowMs) {
      loginThrottle.delete(key);
      continue;
    }

    if (value.lockedUntil && value.lockedUntil <= now) {
      loginThrottle.delete(key);
    }
  }
}

function recordFailedLogin(req) {
  const now = Date.now();
  const key = getClientKey(req);
  const current = loginThrottle.get(key);

  if (!current || now - current.firstAttemptAt > loginWindowMs) {
    loginThrottle.set(key, {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: 0
    });
    return;
  }

  const nextCount = current.count + 1;
  const lockedUntil = nextCount >= maxLoginAttempts ? now + loginLockoutMs : 0;

  loginThrottle.set(key, {
    count: nextCount,
    firstAttemptAt: current.firstAttemptAt,
    lockedUntil
  });
}

function clearFailedLogin(req) {
  loginThrottle.delete(getClientKey(req));
}

function requireLoginThrottle(req, res, next) {
  pruneLoginThrottle();

  const current = loginThrottle.get(getClientKey(req));

  if (current?.lockedUntil && current.lockedUntil > Date.now()) {
    res.redirect("/login?error=rate");
    return;
  }

  next();
}

function isAllowedImageUpload(file) {
  const extension = path.extname(file.originalname || "").toLowerCase();
  return allowedImageMimeTypes.has(file.mimetype) && allowedImageExtensions.has(extension);
}

const allowedThemes = new Set([
  "navy-white-gold",
  "black-white-red",
  "forest-cream-brown",
  "blue-grey-teal",
  "charcoal-soft-blue",
  "deep-green-gold",
  "purple-silver-white",
  "blue-orange-white",
  "grey-mint-white",
  "burgundy-gold-cream"
]);

const allowedFontPresets = new Set([
  "helvetica-neue",
  "georgia",
  "inter",
  "source-pair",
  "roboto"
]);

function normaliseTheme(value) {
  const theme = cleanString(value).toLowerCase();
  return allowedThemes.has(theme) ? theme : "burgundy-gold-cream";
}

function normaliseFontPreset(value) {
  const fontPreset = cleanString(value).toLowerCase();
  return allowedFontPresets.has(fontPreset) ? fontPreset : "source-pair";
}

function normaliseSite(payload) {
  const businessName = cleanString(payload.businessName) || "Project name";

  return {
    theme: normaliseTheme(payload.theme),
    fontPreset: normaliseFontPreset(payload.fontPreset ?? payload.font),
    businessName,
    siteTitle: cleanString(payload.siteTitle) || `${businessName} | Website`,
    siteDescription: cleanString(payload.siteDescription),
    tagline: cleanString(payload.tagline),
    hero: {
      eyebrow: cleanString(payload.hero?.eyebrow),
      title: cleanString(payload.hero?.title),
      intro: cleanString(payload.hero?.intro),
      primaryCtaLabel: cleanString(payload.hero?.primaryCtaLabel),
      primaryCtaHref: cleanString(payload.hero?.primaryCtaHref),
      secondaryCtaLabel: cleanString(payload.hero?.secondaryCtaLabel),
      secondaryCtaHref: cleanString(payload.hero?.secondaryCtaHref),
      badges: cleanStringList(payload.hero?.badges)
    },
    serviceTypes: cleanStringList(payload.serviceTypes),
    services: cleanObjectList(payload.services, ["title", "summary", "anchorText"]),
    story: {
      title: cleanString(payload.story?.title),
      body: cleanString(payload.story?.body),
      highlights: cleanStringList(payload.story?.highlights),
      image: cleanString(payload.story?.image),
      imageAlt: cleanString(payload.story?.imageAlt)
    },
    vehicle: {
      title: cleanString(payload.vehicle?.title),
      body: cleanString(payload.vehicle?.body),
      bullets: cleanStringList(payload.vehicle?.bullets),
      image: cleanString(payload.vehicle?.image),
      imageAlt: cleanString(payload.vehicle?.imageAlt)
    },
    gallery: cleanObjectList(payload.gallery, ["image", "title", "caption", "alt"]),
    faq: cleanObjectList(payload.faq, ["question", "answer"]),
    contact: {
      phoneDisplay: cleanString(payload.contact?.phoneDisplay),
      phoneLink: cleanString(payload.contact?.phoneLink),
      whatsappLink: cleanString(payload.contact?.whatsappLink),
      facebookLink: cleanString(payload.contact?.facebookLink),
      email: cleanString(payload.contact?.email),
      addressLabel: cleanString(payload.contact?.addressLabel),
      locationSummary: cleanString(payload.contact?.locationSummary),
      hours: cleanString(payload.contact?.hours)
    },
    footer: {
      notice: cleanString(payload.footer?.notice),
      legalLocation: cleanString(payload.footer?.legalLocation)
    }
  };
}

async function saveSection(section, value) {
  await store.writeSection(section, value);
  const buildState = await queueBuild();
  return buildState;
}

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/admin");
    return;
  }

  res.sendFile(path.join(rootDir, "admin", "login.html"));
});

app.post("/login", requireLoginThrottle, (req, res) => {
  const username = cleanString(req.body.username);
  const password = cleanString(req.body.password);

  if (!safeEqual(username, credentials.username) || !safeEqual(password, credentials.password)) {
    recordFailedLogin(req);
    res.redirect("/login?error=1");
    return;
  }

  clearFailedLogin(req);
  req.session.regenerate((error) => {
    if (error) {
      res.status(500).send("Unable to start session.");
      return;
    }

    req.session.user = {
      username
    };
    req.session.csrfToken = createCsrfToken();
    res.redirect("/admin");
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(sessionCookieName);
    res.redirect("/login");
  });
});

app.get("/admin", requirePageAuth, (req, res) => {
  res.sendFile(path.join(rootDir, "admin", "index.html"));
});

app.get("/api/bootstrap", requireAuth, async (req, res) => {
  try {
    const content = await store.loadAll();
    res.json({
      ...content,
      buildState: getBuildState(),
      auth: {
        usingFallbackCredentials,
        csrfToken: ensureCsrfToken(req)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to load content."
    });
  }
});

app.post("/api/site", requireAuth, requireCsrf, async (req, res) => {
  try {
    const buildState = await saveSection("site", normaliseSite(req.body));
    res.json({ ok: true, buildState });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to save site content." });
  }
});

app.post("/api/rebuild", requireAuth, requireCsrf, async (req, res) => {
  try {
    const buildState = await queueBuild();
    res.json({ ok: true, buildState });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to rebuild site." });
  }
});

app.post("/api/files/upload", requireAuth, requireCsrf, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file received." });
      return;
    }

    const kind = "image";
    if (!isAllowedImageUpload(req.file)) {
      res.status(400).json({ error: "Only JPG, PNG, WEBP and GIF image uploads are allowed." });
      return;
    }

    const safeFileName = store.sanitiseFileName(req.file.originalname);
    await store.saveUpload(safeFileName, req.file.buffer, kind);

    const existing = await store.readSection("files");
    const record = {
      id: createId(cleanString(req.body.label) || safeFileName, `file-${existing.length + 1}`),
      label: cleanString(req.body.label) || req.file.originalname,
      category: cleanString(req.body.category) || "Image",
      kind,
      publicPath: store.createPublicPath(safeFileName, kind),
      note: cleanString(req.body.note),
      uploadedAt: new Date().toISOString()
    };

    await store.writeSection("files", [...existing, record]);
    const buildState = await queueBuild();
    res.json({ ok: true, buildState, record });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unable to upload file." });
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "up",
    time: new Date().toISOString()
  });
});

app.use(express.static(path.join(rootDir, "dist")));

app.use((req, res) => {
  res.status(404).send("Not found.");
});

async function start() {
  try {
    await queueBuild();
  } catch (error) {
    console.error("Initial build failed:", error);
  }

  app.listen(port, () => {
    console.log(`Admin and preview server running on http://localhost:${port}`);
  });
}

start();
