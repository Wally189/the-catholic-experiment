import fs from "node:fs";
import path from "node:path";

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "");
}

export function loadEnv(rootDir) {
  const envPath = path.join(rootDir, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = stripQuotes(trimmed.slice(index + 1).trim());

    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}
