import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sourceRoots = [
  "frontend-web/app",
  "frontend-web/components",
  "frontend-mobile/app",
  "frontend-mobile/components",
];

const sharedExcluded = [
  ".generated.",
  "/generated/",
  "avatar-engine",
  "avatar-options",
  "google-brand",
  "__tests__",
  ".test.",
];

const chartImportExcluded = [...sharedExcluded, "/charts/"];

const chartLibraries = ["recharts", "victory-native", "victory"];

function isExcluded(relativePath, exclusions = sharedExcluded) {
  return exclusions.some((fragment) => relativePath.includes(fragment));
}

async function collect(directory) {
  const absolute = path.join(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(relative)));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !isExcluded(relative)) {
      files.push(relative);
    }
  }
  return files;
}

async function main() {
  const failures = [];
  const files = (await Promise.all(sourceRoots.map(collect))).flat();

  for (const relativePath of files) {
    const content = await readFile(path.join(root, relativePath), "utf8");

    const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexMatches) {
      failures.push(`${relativePath}: literal color values are not allowed (${hexMatches.join(", ")})`);
    }

    if (!isExcluded(relativePath, chartImportExcluded)) {
      for (const library of chartLibraries) {
        if (
          content.includes(`from "${library}"`) ||
          content.includes(`from '${library}'`) ||
          content.includes(`require("${library}")`)
        ) {
          failures.push(`${relativePath}: chart library ${library} must stay behind components/ui/charts`);
        }
      }
    }

    if (content.includes("Finanzas Familiares") && !relativePath.includes("auth")) {
      failures.push(`${relativePath}: use the Kitho brand instead of the legacy product name`);
    }
  }

  if (failures.length) {
    process.stderr.write(failures.join("\n") + "\n");
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`UI guard passed for ${files.length} files\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}