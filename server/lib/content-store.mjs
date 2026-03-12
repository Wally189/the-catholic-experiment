import fs from "node:fs/promises";
import path from "node:path";

const sectionFiles = {
  site: "site.json",
  notices: "notices.json",
  files: "files.json",
  contacts: "contacts.json",
  clients: "clients.json",
  settings: "settings.json"
};

export function createContentStore(rootDir) {
  const contentDir = path.join(rootDir, "content");
  const mediaDir = path.join(contentDir, "media");
  const filesDir = path.join(contentDir, "files");

  async function readSection(section) {
    const raw = await fs.readFile(path.join(contentDir, sectionFiles[section]), "utf8");
    return JSON.parse(raw);
  }

  async function writeSection(section, value) {
    await fs.writeFile(
      path.join(contentDir, sectionFiles[section]),
      `${JSON.stringify(value, null, 2)}\n`,
      "utf8"
    );
  }

  async function loadAll() {
    const keys = Object.keys(sectionFiles);
    const entries = await Promise.all(keys.map(async (key) => [key, await readSection(key)]));
    return Object.fromEntries(entries);
  }

  async function saveUpload(fileName, buffer, kind) {
    const targetDir = kind === "document" ? filesDir : mediaDir;
    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, fileName);
    await fs.writeFile(targetPath, buffer);
    return targetPath;
  }

  function createPublicPath(fileName, kind) {
    return kind === "document" ? `/assets/files/${fileName}` : `/assets/images/uploads/${fileName}`;
  }

  function sanitiseFileName(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const stem = path
      .basename(fileName, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const safeStem = stem || "upload";
    return `${safeStem}-${Date.now()}${extension}`;
  }

  return {
    loadAll,
    readSection,
    writeSection,
    saveUpload,
    createPublicPath,
    sanitiseFileName
  };
}
