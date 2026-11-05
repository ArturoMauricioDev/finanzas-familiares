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

const chartLibraries = ["victory-native", "victory", "recharts"];

describe("mobile chart boundary", () => {
  it("keeps chart libraries inside components/charts", () => {
    const files = [...walk(path.join(root, "app")), ...walk(path.join(root, "components"))];

    for (const file of files) {
      const relative = path.relative(root, file);
      if (relative.startsWith(path.join("components", "charts"))) continue;

      const content = readFileSync(file, "utf8");
      const importsChart = chartLibraries.some(
        (library) =>
          content.includes(`from "${library}"`) || content.includes(`from '${library}'`),
      );

      expect({ relative, importsChart }).toEqual({ relative, importsChart: false });
      expect(content).not.toContain("ChartContainer");
    }
  });

  it("loads Victory Native lazily inside the chart container", () => {
    const container = readFileSync(
      path.join(root, "components", "charts", "ChartContainer.tsx"),
      "utf8",
    );

    expect(container).toContain('import("victory-native")');
    expect(container).toContain("accessibilityLabel");
  });
});