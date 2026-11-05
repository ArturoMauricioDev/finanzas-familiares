import {
  AVATAR_MAX_LENGTH,
  avatarDataUri,
  createDefaultAvatar,
  defaultAvatarConfig,
  hashString,
  isAvatarDataUri,
  renderAvatarSvg,
} from "../lib/avatar-engine.generated";

describe("mobile avatar engine", () => {
  it("derives a deterministic configuration", () => {
    expect(defaultAvatarConfig("ana@example.com")).toEqual(
      defaultAvatarConfig("ana@example.com"),
    );
    expect(defaultAvatarConfig("ana@example.com")).not.toEqual(
      defaultAvatarConfig("luis@example.com"),
    );
  });

  it("hashes seeds with FNV-1a", () => {
    expect(hashString("kitho")).toBe(hashString("kitho"));
    expect(hashString("kitho")).not.toBe(hashString("kitho2"));
  });

  it("renders a compact SVG data URI within the backend limit", () => {
    const config = defaultAvatarConfig("user-1234");
    const svg = renderAvatarSvg(config);
    const uri = avatarDataUri(config);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    expect(uri.length).toBeLessThanOrEqual(AVATAR_MAX_LENGTH);
  });

  it("validates avatar data URIs", () => {
    expect(isAvatarDataUri(createDefaultAvatar("seed"))).toBe(true);
    expect(isAvatarDataUri("https://example.com/avatar.png")).toBe(false);
    expect(isAvatarDataUri(undefined)).toBe(false);
  });

  it("includes clothing and eyes in the generated configuration", () => {
    const config = defaultAvatarConfig("seed");
    expect(Number.isInteger(config.clothes)).toBe(true);
    expect(Number.isInteger(config.eyes)).toBe(true);

    const svg = renderAvatarSvg(config);
    expect(renderAvatarSvg({ ...config, clothes: (config.clothes + 1) % 3 })).not.toBe(svg);
    expect(renderAvatarSvg({ ...config, eyes: (config.eyes + 1) % 3 })).not.toBe(svg);
  });
});