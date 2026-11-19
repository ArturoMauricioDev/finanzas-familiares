import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokensPath = path.join(root, "design-tokens", "tokens.json");

const MIN_TEXT = 4.5;
const MIN_UI = 3;

const uiPairs = [
  ["outline", "surface"],
  ["primary", "surface"],
  ["error", "surface"],
  ["onSurface", "surfaceContainerHigh"],
];

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!match) throw new Error(`invalid color value: ${hex}`);
  const int = parseInt(match[1], 16);
  const r = channel((int >> 16) & 0xff);
  const g = channel((int >> 8) & 0xff);
  const b = channel(int & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [high, low] = a > b ? [a, b] : [b, a];
  return (high + 0.05) / (low + 0.05);
}

/** `onPrimaryContainer` -> `primaryContainer`; `inverseOnSurface` -> `inverseSurface`. */
function backgroundKey(foregroundKey) {
  if (foregroundKey.startsWith("inverseOn")) {
    return `inverse${foregroundKey.slice("inverseOn".length)}`;
  }
  if (foregroundKey.startsWith("on") && /^[A-Z]/.test(foregroundKey[2] ?? "")) {
    return foregroundKey[2].toLowerCase() + foregroundKey.slice(3);
  }
  return null;
}

async function main() {
  const tokens = JSON.parse(await readFile(tokensPath, "utf8"));
  const modes = tokens.color ?? {};
  const failures = [];
  let checked = 0;

  for (const [mode, palette] of Object.entries(modes)) {
    if (!palette || typeof palette !== "object") continue;

    for (const foreground of Object.keys(palette)) {
      const background = backgroundKey(foreground);
      if (!background) continue;
      if (!(background in palette)) {
        failures.push(`${mode}: ${foreground} has no matching ${background}`);
        continue;
      }
      checked += 1;
      const value = ratio(palette[foreground], palette[background]);
      if (value < MIN_TEXT) {
        failures.push(
          `${mode}: ${foreground}/${background} is ${value.toFixed(2)}:1 (minimum ${MIN_TEXT}:1 for text)`,
        );
      }
    }

    for (const [foreground, background] of uiPairs) {
      if (!(foreground in palette) || !(background in palette)) continue;
      checked += 1;
      const value = ratio(palette[foreground], palette[background]);
      if (value < MIN_UI) {
        failures.push(
          `${mode}: ${foreground}/${background} is ${value.toFixed(2)}:1 (minimum ${MIN_UI}:1 for components and focus)`,
        );
      }
    }
  }

  if (checked === 0) {
    process.stderr.write("No color pairs were checked; design-tokens/tokens.json is missing color modes.\n");
    process.exitCode = 1;
    return;
  }

  if (failures.length) {
    process.stderr.write(failures.join("\n") + "\n");
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`Contrast guard passed for ${checked} token pairs (4.5:1 text, 3:1 UI).\n`);
}

await main();