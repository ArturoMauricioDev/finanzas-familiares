import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) return walk(absolute);
    return /\.(ts|tsx)$/.test(entry) ? [absolute] : [];
  });
}

const chartLibraries = ["recharts", "victory-native", "victory"];

describe("chart boundary", () => {
  it("keeps chart libraries inside components/charts", () => {
    const files = [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))];

    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const relative = path.relative(root, file);
      const importsChart = chartLibraries.some(
        (library) =>
          content.includes(`from "${library}"`) || content.includes(`from '${library}'`),
      );

      if (relative.startsWith(path.join("components", "charts"))) {
        continue;
      }

      expect({ relative, importsChart }).toEqual({ relative, importsChart: false });
      expect(content).not.toContain("ChartContainer");
    }
  });

  it("loads Recharts lazily from the chart container", () => {
    const canvas = readFileSync(
      path.join(root, "components", "charts", "ChartCanvas.tsx"),
      "utf8",
    );
    const container = readFileSync(
      path.join(root, "components", "charts", "ChartContainer.tsx"),
      "utf8",
    );

    expect(canvas).toContain('from "recharts"');
    expect(container).toContain("next/dynamic");
    expect(container).toContain("ssr: false");
  });
});