import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildFiles } from "./generate-shared.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function flattenKeys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function diffKeys(left, right) {
  const leftKeys = new Set(flattenKeys(left));
  const rightKeys = new Set(flattenKeys(right));
  return {
    missingInEnglish: [...leftKeys].filter((key) => !rightKeys.has(key)),
    missingInSpanish: [...rightKeys].filter((key) => !leftKeys.has(key)),
  };
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function main() {
  const fs = await import("node:fs/promises");
  const es = JSON.parse(await readText("shared/i18n/es.json"));
  const en = JSON.parse(await readText("shared/i18n/en.json"));
  const { missingInEnglish, missingInSpanish } = diffKeys(es, en);
  const failures = [];

  if (missingInEnglish.length) {
    failures.push(`Missing in en.json: ${missingInEnglish.join(", ")}`);
  }
  if (missingInSpanish.length) {
    failures.push(`Missing in es.json: ${missingInSpanish.join(", ")}`);
  }

  const generated = await buildFiles();
  for (const [relativePath, expected] of generated) {
    let actual = "";
    try {
      actual = await readText(relativePath);
    } catch {
      actual = "";
    }
    if (actual !== expected) {
      failures.push(`Stale generated file: ${relativePath}`);
    }
  }

  const tokens = JSON.parse(await readText("design-tokens/tokens.json"));
  const lightKeys = Object.keys(tokens.color.light).sort();
  const darkKeys = Object.keys(tokens.color.dark).sort();
  if (JSON.stringify(lightKeys) !== JSON.stringify(darkKeys)) {
    failures.push("Light and dark color role sets must match");
  }

  const errorKeys = JSON.parse(await readText("shared/errors/error-keys.json"));
  for (const [detail, key] of Object.entries(errorKeys.details)) {
    const value = key.split(".").reduce((current, part) => current?.[part], es);
    if (typeof value !== "string") {
      failures.push(`Missing Spanish error copy for detail: ${detail}`);
    }
  }

  if (failures.length) {
    process.stderr.write(failures.join("\n") + "\n");
    process.exitCode = 1;
    return;
  }

  process.stdout.write("Shared artifacts are synchronized\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
