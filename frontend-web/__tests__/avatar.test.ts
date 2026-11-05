import {
  AVATAR_MAX_LENGTH,
  avatarDataUri,
  createDefaultAvatar,
  defaultAvatarConfig,
  hashString,
  isAvatarDataUri,
  renderAvatarSvg,
} from "../lib/avatar-engine.generated";

describe("avatar engine", () => {
  it("derives a deterministic configuration from the seed", () => {
    expect(defaultAvatarConfig("ana@example.com")).toEqual(
      defaultAvatarConfig("ana@example.com"),
    );
    expect(defaultAvatarConfig("ana@example.com")).not.toEqual(
      defaultAvatarConfig("luis@example.com"),
    );
  });

  it("produces a stable FNV-1a hash", () => {
    expect(hashString("kitho")).toBe(hashString("kitho"));
    expect(hashString("kitho")).not.toBe(hashString("kitho2"));
  });

  it("renders a compact SVG data URI below the backend limit", () => {
    const seed = "user-1234";
    const config = defaultAvatarConfig(seed);
    const svg = renderAvatarSvg(config);
    const uri = avatarDataUri(config);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 128 128"');
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    expect(uri.length).toBeLessThanOrEqual(AVATAR_MAX_LENGTH);
  });

  it("validates default avatar data URIs", () => {
    const uri = createDefaultAvatar("user-1234");
    expect(isAvatarDataUri(uri)).toBe(true);
    expect(isAvatarDataUri("https://example.com/avatar.png")).toBe(false);
    expect(isAvatarDataUri(null)).toBe(false);
  });

  it("is deterministic for the same default avatar", () => {
    expect(createDefaultAvatar("seed-value")).toBe(createDefaultAvatar("seed-value"));
  });

  it("includes clothing and eyes in the generated configuration", () => {
    const config = defaultAvatarConfig("seed-value");
    expect(Number.isInteger(config.clothes)).toBe(true);
    expect(Number.isInteger(config.eyes)).toBe(true);

    const svg = renderAvatarSvg(config);
    const changedClothes = renderAvatarSvg({ ...config, clothes: (config.clothes + 1) % 3 });
    const changedEyes = renderAvatarSvg({ ...config, eyes: (config.eyes + 1) % 3 });

    expect(changedClothes).not.toBe(svg);
    expect(changedEyes).not.toBe(svg);
  });
});