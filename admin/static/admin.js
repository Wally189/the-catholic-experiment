const state = {
  site: null,
  files: [],
  buildState: null,
  auth: null
};

const availableThemes = [
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
];

const availableFonts = [
  "helvetica-neue",
  "georgia",
  "inter",
  "source-pair",
  "roboto"
];

const simpleLists = {
  heroBadges: {
    containerId: "heroBadgesList",
    addId: "addHeroBadge",
    placeholder: "Essays"
  },
  serviceTypes: {
    containerId: "serviceTypesList",
    addId: "addServiceType",
    placeholder: "Liturgical notes"
  },
  storyHighlights: {
    containerId: "storyHighlightsList",
    addId: "addStoryHighlight",
    placeholder: "Warm editorial tone"
  },
  vehicleBullets: {
    containerId: "vehicleBulletsList",
    addId: "addVehicleBullet",
    placeholder: "Clear publishing rhythm"
  }
};

const objectLists = {
  services: {
    containerId: "servicesList",
    addId: "addService",
    fields: [
      { key: "title", label: "Title", placeholder: "Essays and meditations" },
      { key: "summary", label: "Summary", type: "textarea", full: true, placeholder: "Describe the section." },
      { key: "anchorText", label: "Support line", placeholder: "For serious reading and reflection" }
    ]
  },
  gallery: {
    containerId: "galleryList",
    addId: "addGalleryItem",
    fields: [
      { key: "image", label: "Image path", placeholder: "/assets/images/placeholders/library-notes.svg", full: true, isImage: true },
      { key: "title", label: "Title", placeholder: "Library notes" },
      { key: "caption", label: "Caption", type: "textarea", full: true, placeholder: "Describe this artwork." }
    ]
  },
  faq: {
    containerId: "faqList",
    addId: "addFaqItem",
    fields: [
      { key: "question", label: "Question", full: true, placeholder: "Is this a finished publication?" },
      { key: "answer", label: "Answer", type: "textarea", full: true, placeholder: "Add a short answer." }
    ]
  }
};

let activeImageInput = null;

document.addEventListener("DOMContentLoaded", async () => {
  bindImageTracking();
  bindRepeaters();
  bindActions();

  try {
    await loadState();
    renderAll();
  } catch (error) {
    showToast(error.message || "Unable to load website content.");
  }
});

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bindImageTracking() {
  document.addEventListener("focusin", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("[data-image-input]")) {
      activeImageInput = event.target;
    }
  });
}

function bindRepeaters() {
  Object.entries(simpleLists).forEach(([key, config]) => {
    byId(config.addId)?.addEventListener("click", () => addSimpleItem(key, ""));
  });

  Object.entries(objectLists).forEach(([key, config]) => {
    byId(config.addId)?.addEventListener("click", () => addObjectItem(key, {}));
  });

  document.addEventListener("click", async (event) => {
    const simpleButton = event.target.closest("[data-remove-simple]");
    if (simpleButton) {
      simpleButton.closest(".simple-item")?.remove();
      return;
    }

    const objectButton = event.target.closest("[data-remove-object]");
    if (objectButton) {
      objectButton.closest(".object-card")?.remove();
      return;
    }

    const useImageButton = event.target.closest("[data-use-image]");
    if (useImageButton) {
      await handleUseImage(useImageButton.getAttribute("data-use-image") || "");
      return;
    }

    const copyImageButton = event.target.closest("[data-copy-image]");
    if (copyImageButton) {
      await copyPath(copyImageButton.getAttribute("data-copy-image") || "", "Image path copied.");
    }
  });
}

function bindActions() {
  byId("siteForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await runTask(() =>
      saveJson("/api/site", collectSitePayload(), "Website changes saved and rebuilt.")
    );
  });

  byId("uploadForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await runTask(() => uploadImage());
  });

  byId("rebuildSite")?.addEventListener("click", async () => {
    await runTask(() => triggerRebuild());
  });

  document.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === "siteTheme") {
      applyTheme(event.target.value);
    }

    if (event.target instanceof HTMLInputElement && event.target.name === "siteFontPreset") {
      applyFont(event.target.value);
    }
  });
}

async function loadState() {
  const response = await fetch("/api/bootstrap", {
    credentials: "same-origin"
  });

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load site data.");
  }

  state.site = payload.site;
  state.files = payload.files || [];
  state.buildState = payload.buildState || null;
  state.auth = payload.auth || null;
}

function renderAll() {
  renderHeader();
  renderStatus();
  renderSiteForm();
  applyTheme(state.site?.theme);
  applyFont(state.site?.fontPreset);
  renderImageOptions();
  renderImageLibrary();
}

function renderHeader() {
  byId("dashboardTitle").textContent = state.site?.businessName || "Project Editor";
  byId("dashboardIntro").textContent = "Update text, artwork, colours, or fonts and rebuild the static site.";
}

function renderStatus() {
  byId("buildStatusText").textContent = formatBuildStatus(state.buildState);
  byId("overviewBuildStatus").textContent = statusLabel(state.buildState);
  byId("overviewBuildTime").textContent = formatDate(state.buildState?.generatedAt);
  byId("metricServices").textContent = String(state.site?.services?.length || 0);
  byId("metricImages").textContent = String((state.files || []).filter((item) => item.kind === "image").length);
  byId("fallbackWarning").hidden = !(state.auth?.usingFallbackCredentials);
}

function renderSiteForm() {
  const site = state.site || {};

  setValue("businessName", site.businessName);
  setValue("tagline", site.tagline);
  setFontValue(site.fontPreset);
  setValue("heroEyebrow", site.hero?.eyebrow);
  setValue("heroTitle", site.hero?.title);
  setValue("heroIntro", site.hero?.intro);
  setValue("heroPrimaryLabel", site.hero?.primaryCtaLabel);
  setValue("heroSecondaryLabel", site.hero?.secondaryCtaLabel);

  setValue("storyTitle", site.story?.title);
  setValue("storyBody", site.story?.body);
  setValue("storyImage", site.story?.image);

  setValue("vehicleTitle", site.vehicle?.title);
  setValue("vehicleBody", site.vehicle?.body);
  setValue("vehicleImage", site.vehicle?.image);

  setValue("contactPhoneDisplay", site.contact?.phoneDisplay);
  setValue("contactWhatsAppLink", site.contact?.whatsappLink);
  setValue("contactFacebookLink", site.contact?.facebookLink);
  setValue("contactEmail", site.contact?.email);
  setValue("contactAddressLabel", site.contact?.addressLabel);
  setValue("contactLocationSummary", site.contact?.locationSummary);
  setValue("contactHours", site.contact?.hours);

  setValue("footerNotice", site.footer?.notice);
  setValue("footerLocation", site.footer?.legalLocation);
  setThemeValue(site.theme);

  renderSimpleList("heroBadges", site.hero?.badges || []);
  renderSimpleList("serviceTypes", site.serviceTypes || []);
  renderSimpleList("storyHighlights", site.story?.highlights || []);
  renderSimpleList("vehicleBullets", site.vehicle?.bullets || []);
  renderObjectList("services", site.services || []);
  renderObjectList("gallery", site.gallery || []);
  renderObjectList("faq", site.faq || []);
}

function renderImageOptions() {
  const imagePaths = byId("imagePaths");
  imagePaths.innerHTML = "";

  (state.files || [])
    .filter((item) => item.kind === "image")
    .forEach((item) => {
      const option = document.createElement("option");
      option.value = item.publicPath;
      imagePaths.append(option);
    });
}

function renderImageLibrary() {
  const host = byId("imageLibrary");
  host.innerHTML = "";

  const images = (state.files || []).filter((item) => item.kind === "image");
  if (!images.length) {
    host.innerHTML = '<p class="helper-text">No images available yet.</p>';
    return;
  }

  images.forEach((item) => {
    const card = document.createElement("article");
    card.className = "library-item";
    card.innerHTML = `
      <div class="library-thumb">
        <img src="${escapeHtml(item.publicPath)}" alt="${escapeHtml(item.label || "Uploaded image")}">
      </div>
      <div class="library-body">
        <strong>${escapeHtml(item.label || "Image")}</strong>
        <p class="helper-text">${escapeHtml(item.note || "Available for hero, gallery, or section artwork.")}</p>
        <code>${escapeHtml(item.publicPath)}</code>
        <div class="library-actions">
          <button type="button" class="admin-btn admin-btn-secondary small" data-use-image="${escapeHtml(item.publicPath)}">Use image</button>
          <button type="button" class="admin-btn admin-btn-secondary small" data-copy-image="${escapeHtml(item.publicPath)}">Copy path</button>
        </div>
      </div>
    `;
    host.append(card);
  });
}

function renderSimpleList(key, items) {
  const config = simpleLists[key];
  const container = byId(config.containerId);
  container.innerHTML = "";
  items.forEach((value) => addSimpleItem(key, value, true));
}

function addSimpleItem(key, value, appendOnly = false) {
  const config = simpleLists[key];
  const container = byId(config.containerId);
  const wrapper = document.createElement("div");
  wrapper.className = "simple-item";
  wrapper.innerHTML = `
    <input type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(config.placeholder)}">
    <button type="button" class="admin-btn admin-btn-secondary small" data-remove-simple="${key}">Remove</button>
  `;

  container.append(wrapper);

  if (!appendOnly) {
    wrapper.querySelector("input")?.focus();
  }
}

function renderObjectList(key, items) {
  const config = objectLists[key];
  const container = byId(config.containerId);
  container.innerHTML = "";
  items.forEach((value) => addObjectItem(key, value, true));
}

function addObjectItem(key, value, appendOnly = false) {
  const config = objectLists[key];
  const container = byId(config.containerId);
  const card = document.createElement("div");
  card.className = "object-card";
  card.innerHTML = config.fields.map((field) => renderField(field, value[field.key] || "")).join("");
  card.innerHTML += `
    <div class="object-actions">
      <button type="button" class="admin-btn admin-btn-secondary small" data-remove-object="${key}">Remove</button>
    </div>
  `;

  container.append(card);

  if (!appendOnly) {
    card.querySelector("input, textarea")?.focus();
  }
}

function renderField(field, value) {
  const common = `data-field="${field.key}"`;
  const escapedValue = escapeHtml(value);
  const full = field.full ? " full" : "";

  if (field.type === "textarea") {
    return `<label class="field${full}"><span>${escapeHtml(field.label)}</span><textarea ${common} rows="4" placeholder="${escapeHtml(field.placeholder || "")}">${escapedValue}</textarea></label>`;
  }

  const imageAttrs = field.isImage ? ' list="imagePaths" data-image-input="true"' : "";
  return `<label class="field${full}"><span>${escapeHtml(field.label)}</span><input ${common}${imageAttrs} type="text" value="${escapedValue}" placeholder="${escapeHtml(field.placeholder || "")}"></label>`;
}

function collectSitePayload() {
  const businessName = getValue("businessName");
  const tagline = getValue("tagline");
  const heroTitle = getValue("heroTitle");
  const heroIntro = getValue("heroIntro");
  const storyTitle = getValue("storyTitle");
  const storyImage = getValue("storyImage");
  const vehicleTitle = getValue("vehicleTitle");
  const vehicleImage = getValue("vehicleImage");
  const phoneDisplay = getValue("contactPhoneDisplay");
  const addressLabel = getValue("contactAddressLabel");

  return {
    theme: getThemeValue(),
    fontPreset: getFontValue(),
    businessName,
    tagline,
    siteTitle: buildSiteTitle(businessName, tagline),
    siteDescription: buildSiteDescription(tagline, heroIntro),
    hero: {
      eyebrow: getValue("heroEyebrow") || state.site?.hero?.eyebrow || "",
      title: heroTitle,
      intro: heroIntro,
      primaryCtaLabel: getValue("heroPrimaryLabel"),
      primaryCtaHref: state.site?.hero?.primaryCtaHref || "#contact",
      secondaryCtaLabel: getValue("heroSecondaryLabel"),
      secondaryCtaHref: state.site?.hero?.secondaryCtaHref || "#services",
      badges: collectSimpleList("heroBadges")
    },
    serviceTypes: collectSimpleList("serviceTypes"),
    services: collectObjectList("services"),
    story: {
      title: storyTitle,
      body: getValue("storyBody"),
      highlights: collectSimpleList("storyHighlights"),
      image: storyImage,
      imageAlt: buildImageAlt(storyTitle, state.site?.story?.imageAlt, "Story image")
    },
    vehicle: {
      title: vehicleTitle,
      body: getValue("vehicleBody"),
      bullets: collectSimpleList("vehicleBullets"),
      image: vehicleImage,
      imageAlt: buildImageAlt(vehicleTitle, state.site?.vehicle?.imageAlt, "Vehicle image")
    },
    gallery: collectObjectList("gallery").map((item, index) => ({
      ...item,
      alt: buildImageAlt(item.title, state.site?.gallery?.[index]?.alt, "Gallery image")
    })),
    faq: collectObjectList("faq"),
    contact: {
      phoneDisplay,
      phoneLink: normalisePhoneLink(phoneDisplay),
      whatsappLink: getValue("contactWhatsAppLink"),
      facebookLink: getValue("contactFacebookLink"),
      email: getValue("contactEmail"),
      addressLabel,
      locationSummary: getValue("contactLocationSummary"),
      hours: getValue("contactHours")
    },
    footer: {
      notice: getValue("footerNotice"),
      legalLocation: getValue("footerLocation") || addressLabel
    }
  };
}

function collectSimpleList(key) {
  const config = simpleLists[key];
  return [...byId(config.containerId).querySelectorAll("input")]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function collectObjectList(key) {
  const config = objectLists[key];
  return [...byId(config.containerId).querySelectorAll(".object-card")]
    .map((card) => {
      const entry = {};
      config.fields.forEach((field) => {
        const input = card.querySelector(`[data-field="${field.key}"]`);
        entry[field.key] = input ? input.value.trim() : "";
      });
      return entry;
    })
    .filter((entry) => Object.values(entry).some(Boolean));
}

async function saveJson(url, payload, message) {
  const response = await fetch(url, {
    method: "POST",
    headers: createJsonHeaders(),
    credentials: "same-origin",
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    throw new Error(result.error || "Save failed.");
  }

  await loadState();
  renderAll();
  showToast(message);
}

async function uploadImage() {
  const fileInput = byId("uploadFile");
  if (!fileInput.files?.length) {
    throw new Error("Choose an image first.");
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("kind", "image");
  formData.append("label", byId("uploadLabel").value);
  formData.append("category", "Image");
  formData.append("note", byId("uploadNote").value);

  const response = await fetch("/api/files/upload", {
    method: "POST",
    headers: createCsrfHeaders(),
    credentials: "same-origin",
    body: formData
  });

  const result = await response.json();

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    throw new Error(result.error || "Upload failed.");
  }

  byId("uploadForm").reset();
  await loadState();
  renderAll();
  await copyPath(result.record?.publicPath || "", "Image uploaded. Path copied.");
}

async function triggerRebuild() {
  const response = await fetch("/api/rebuild", {
    method: "POST",
    headers: createCsrfHeaders(),
    credentials: "same-origin"
  });
  const result = await response.json();

  if (response.status === 401) {
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    throw new Error(result.error || "Rebuild failed.");
  }

  await loadState();
  renderAll();
  showToast("Static site rebuilt.");
}

async function handleUseImage(path) {
  if (!path) {
    return;
  }

  if (activeImageInput && document.body.contains(activeImageInput)) {
    activeImageInput.value = path;
    activeImageInput.focus();
    showToast("Image path added to the selected field.");
    return;
  }

  await copyPath(path, "Image path copied. Select an image field and paste it.");
}

async function copyPath(path, message) {
  if (!path) {
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(path);
    } else {
      const helper = document.createElement("textarea");
      helper.value = path;
      document.body.append(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
  } catch {
    showToast(path);
    return;
  }

  showToast(message);
}

function formatBuildStatus(buildState) {
  if (!buildState?.status) {
    return "No build recorded yet.";
  }

  if (buildState.status === "success") {
    return `Ready. Last build ${formatDate(buildState.generatedAt)}.`;
  }

  if (buildState.status === "running") {
    return "Build in progress...";
  }

  return `Build failed: ${buildState.error || "Unknown error."}`;
}

function statusLabel(buildState) {
  if (!buildState?.status) {
    return "Idle";
  }

  if (buildState.status === "success") {
    return "Ready";
  }

  if (buildState.status === "running") {
    return "Building";
  }

  return "Error";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

async function runTask(action) {
  try {
    await action();
  } catch (error) {
    showToast(error.message || "Something went wrong.");
  }
}

function getValue(id) {
  return byId(id)?.value?.trim() || "";
}

function setValue(id, value) {
  const input = byId(id);
  if (input) {
    input.value = value || "";
  }
}

function getThemeValue() {
  const selected = document.querySelector('input[name="siteTheme"]:checked');
  return normaliseTheme(selected?.value);
}

function setThemeValue(value) {
  const theme = normaliseTheme(value);
  const selected = document.querySelector(`input[name="siteTheme"][value="${theme}"]`);
  if (selected instanceof HTMLInputElement) {
    selected.checked = true;
  }
}

function normaliseTheme(value) {
  return availableThemes.includes(value) ? value : "burgundy-gold-cream";
}

function applyTheme(value) {
  const theme = normaliseTheme(value);
  document.body.classList.remove(...availableThemes.map((item) => `theme-${item}`));
  document.body.classList.add(`theme-${theme}`);
}

function getFontValue() {
  const selected = document.querySelector('input[name="siteFontPreset"]:checked');
  return normaliseFontPreset(selected?.value);
}

function setFontValue(value) {
  const fontPreset = normaliseFontPreset(value);
  const selected = document.querySelector(`input[name="siteFontPreset"][value="${fontPreset}"]`);
  if (selected instanceof HTMLInputElement) {
    selected.checked = true;
  }
}

function normaliseFontPreset(value) {
  return availableFonts.includes(value) ? value : "source-pair";
}

function applyFont(value) {
  const fontPreset = normaliseFontPreset(value);
  document.body.classList.remove(...availableFonts.map((item) => `font-${item}`));
  document.body.classList.add(`font-${fontPreset}`);
}

function buildSiteTitle(businessName, tagline) {
  const safeBusinessName = businessName || state.site?.businessName || "Project name";
  const summary = tagline || state.site?.tagline || "Catholic editorial concept";
  return `${safeBusinessName} | ${summary}`;
}

function buildSiteDescription(tagline, heroIntro) {
  return tagline || heroIntro || state.site?.siteDescription || "";
}

function buildImageAlt(title, fallback, defaultValue) {
  return fallback || title || defaultValue;
}

function normalisePhoneLink(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function createJsonHeaders() {
  return {
    "Content-Type": "application/json",
    ...createCsrfHeaders()
  };
}

function createCsrfHeaders() {
  const token = state.auth?.csrfToken;
  return token ? { "x-csrf-token": token } : {};
}

function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}
