import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import nunjucks from "nunjucks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const contentDir = path.join(rootDir, "content");
const templatesDir = path.join(rootDir, "templates");
const defaultOutputDir = path.join(rootDir, "dist");
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

const fontPresets = {
  "helvetica-neue": {
    className: "font-helvetica-neue",
    stylesheetHref: ""
  },
  georgia: {
    className: "font-georgia",
    stylesheetHref: ""
  },
  inter: {
    className: "font-inter",
    stylesheetHref: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
  },
  "source-pair": {
    className: "font-source-pair",
    stylesheetHref: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:wght@400;600;700&display=swap"
  },
  roboto: {
    className: "font-roboto",
    stylesheetHref: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
  }
};

const allowedFontPresets = new Set(Object.keys(fontPresets));

function createBrandMark(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !["the", "a", "an", "of", "and"].includes(part.toLowerCase()));
  const significantParts = parts.length
    ? parts
    : String(value || "").trim().split(/\s+/).filter(Boolean);
  const initials = significantParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "WS";
}

async function readJson(fileName) {
  const raw = await fs.readFile(path.join(contentDir, fileName), "utf8");
  return JSON.parse(raw);
}

function normalisePhoneHref(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function createRenderer() {
  return nunjucks.configure(templatesDir, {
    autoescape: true,
    noCache: true
  });
}

async function copyDirectory(source, target) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(source, target, { recursive: true, force: true });
}

async function ensureDirectory(target) {
  await fs.mkdir(target, { recursive: true });
}

async function copyDirectoryIfPresent(source, target) {
  try {
    await fs.access(source);
  } catch {
    await ensureDirectory(target);
    return;
  }

  await copyDirectory(source, target);
}

async function writePage(renderer, template, outputFile, context) {
  const html = renderer.render(template, context);
  const outputPath = path.join(context.outputDir, outputFile);
  await ensureDirectory(path.dirname(outputPath));
  await fs.writeFile(outputPath, html, "utf8");
}

function normaliseBasePath(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

function prefixPublicPath(value, basePath) {
  const raw = String(value || "");

  if (!raw.startsWith("/")) {
    return raw;
  }

  if (!basePath) {
    return raw;
  }

  return raw === "/" ? `${basePath}/` : `${basePath}${raw}`;
}

function prefixSitePaths(value, basePath) {
  if (Array.isArray(value)) {
    return value.map((item) => prefixSitePaths(item, basePath));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, prefixSitePaths(entry, basePath)])
    );
  }

  if (typeof value === "string") {
    return prefixPublicPath(value, basePath);
  }

  return value;
}

function normaliseFontPreset(value) {
  const fontPreset = String(value || "source-pair").trim().toLowerCase();
  return allowedFontPresets.has(fontPreset) ? fontPreset : "source-pair";
}

function withDerivedData(site) {
  const candidateTheme = String(site.theme || "burgundy-gold-cream").toLowerCase();
  const theme = allowedThemes.has(candidateTheme) ? candidateTheme : "burgundy-gold-cream";
  const fontPreset = normaliseFontPreset(site.fontPreset || site.font);
  const fontConfig = fontPresets[fontPreset];
  const basePath = normaliseBasePath(process.env.BASE_PATH);
  const publicSiteOnly = process.env.PUBLIC_SITE_ONLY === "1";
  const prefixedSite = prefixSitePaths(site, basePath);
  const adminLinkHref = publicSiteOnly ? "" : prefixPublicPath("/login", basePath);
  const adminLinkIsExternal = /^https?:\/\//i.test(adminLinkHref);

  return {
    ...prefixedSite,
    brandMark: createBrandMark(site.businessName),
    theme,
    themeClass: `theme-${theme}`,
    fontPreset,
    fontClass: fontConfig.className,
    fontStylesheetHref: fontConfig.stylesheetHref,
    basePath,
    homeHref: prefixPublicPath("/", basePath),
    gdprHref: prefixPublicPath("/gdpr.html", basePath),
    privacyHref: prefixPublicPath("/privacy.html", basePath),
    termsHref: prefixPublicPath("/terms.html", basePath),
    loginHref: prefixPublicPath("/login", basePath),
    adminLinkHref,
    adminLinkIsExternal,
    assetCssHref: prefixPublicPath("/assets/css/site.css", basePath),
    assetJsHref: prefixPublicPath("/assets/js/site.js", basePath),
    showAdminLink: Boolean(adminLinkHref),
    contact: {
      ...prefixedSite.contact,
      phoneHref: site.contact.phoneLink || normalisePhoneHref(site.contact.phoneDisplay)
    }
  };
}

export async function buildSite() {
  const site = await readJson("site.json");
  const renderer = createRenderer();
  const siteData = withDerivedData(site);
  const year = new Date().getFullYear();
  const generatedAt = new Date().toISOString();
  const outputDir = process.env.OUTPUT_DIR
    ? path.resolve(rootDir, process.env.OUTPUT_DIR)
    : defaultOutputDir;

  await ensureDirectory(outputDir);

  await Promise.all([
    copyDirectory(path.join(rootDir, "src", "assets"), path.join(outputDir, "assets")),
    copyDirectoryIfPresent(path.join(contentDir, "media"), path.join(outputDir, "assets", "images", "uploads")),
    copyDirectoryIfPresent(path.join(contentDir, "files"), path.join(outputDir, "assets", "files"))
  ]);

  const baseContext = {
    site: siteData,
    year,
    outputDir
  };

  await Promise.all([
    writePage(renderer, "pages/index.njk", "index.html", {
      ...baseContext,
      pageTitle: siteData.siteTitle,
      pageDescription: siteData.siteDescription
    }),
    writePage(renderer, "pages/gdpr.njk", "gdpr.html", {
      ...baseContext,
      bodyClass: "legal-page",
      pageTitle: `GDPR | ${siteData.businessName}`,
      pageDescription: `Data protection information for ${siteData.businessName}.`
    }),
    writePage(renderer, "pages/privacy.njk", "privacy.html", {
      ...baseContext,
      bodyClass: "legal-page",
      pageTitle: `Privacy | ${siteData.businessName}`,
      pageDescription: `Privacy information for ${siteData.businessName}.`
    }),
    writePage(renderer, "pages/terms.njk", "terms.html", {
      ...baseContext,
      bodyClass: "legal-page",
      pageTitle: `Terms | ${siteData.businessName}`,
      pageDescription: `Website terms for ${siteData.businessName}.`
    })
  ]);

  await fs.writeFile(
    path.join(outputDir, "build-meta.json"),
    JSON.stringify(
      {
        generatedAt,
        businessName: siteData.businessName
      },
      null,
      2
    ),
    "utf8"
  );

  if (process.env.PUBLIC_SITE_ONLY === "1") {
    await fs.writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");
  }

  return {
    generatedAt,
    distDir: outputDir
  };
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  buildSite().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
