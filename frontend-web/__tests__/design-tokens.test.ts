import {
  breakpoints,
  colorNames,
  darkColors,
  lightColors,
  seed,
  spacing,
  touchTarget,
  typography,
} from "../lib/generated/tokens";

describe("generated design tokens", () => {
  it("uses the MD3 seed color and symmetric theme roles", () => {
    expect(seed).toBe("#6750A4");
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
    expect(colorNames).toContain("primary");
    expect(colorNames).toContain("success");
    expect(colorNames).toContain("warning");
    expect(colorNames).toContain("outlineVariant");
  });

  it("defines the MD3 window breakpoints and touch target", () => {
    expect(breakpoints).toEqual({ compact: 0, medium: 600, expanded: 840 });
    expect(touchTarget.min).toBe(48);
  });

  it("ships the MD3 typography scale and 4px spacing grid", () => {
    expect(typography.displayLarge.fontSize).toBe(57);
    expect(typography.labelSmall.fontSize).toBe(11);
    expect(spacing[4]).toBe(16);
  });

  it("only uses valid hex color values", () => {
    for (const value of Object.values(lightColors)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    for (const value of Object.values(darkColors)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});