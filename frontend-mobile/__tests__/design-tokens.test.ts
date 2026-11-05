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

describe("mobile design tokens", () => {
  it("uses the MD3 seed and symmetric color roles", () => {
    expect(seed).toBe("#6750A4");
    expect(Object.keys(lightColors).sort()).toEqual(Object.keys(darkColors).sort());
    expect(colorNames).toEqual(expect.arrayContaining(["primary", "success", "warning"]));
  });

  it("defines breakpoints, typography and touch targets", () => {
    expect(breakpoints).toEqual({ compact: 0, medium: 600, expanded: 840 });
    expect(typography.displayLarge.fontSize).toBe(57);
    expect(typography.bodyLarge.fontSize).toBe(16);
    expect(spacing[4]).toBe(16);
    expect(touchTarget.min).toBe(48);
  });

  it("only uses valid hex colors", () => {
    for (const value of Object.values(lightColors)) {
      expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});