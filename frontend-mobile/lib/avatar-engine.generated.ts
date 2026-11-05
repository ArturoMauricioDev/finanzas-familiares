import options from "./avatar-options.generated";

export const AVATAR_MAX_LENGTH = 2048;

export interface AvatarConfig {
  version: number;
  palette: number;
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  clothes: number;
  eyes: number;
  facialHair: number;
  accessory: number;
  expression: number;
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick(length: number, hash: number, salt: number): number {
  return (hash >>> (salt % 16)) % length;
}

export function defaultAvatarConfig(seed: string): AvatarConfig {
  const hash = hashString(seed);
  return {
    version: options.version,
    palette: pick(options.palettes.length, hash, 0),
    skinTone: pick(options.skinTones.length, hash, 2),
    hairStyle: pick(options.hairStyles.length, hash, 4),
    hairColor: pick(options.hairColors.length, hash, 6),
    clothes: pick(options.clothes.length, hash, 8),
    eyes: pick(options.eyes.length, hash, 10),
    facialHair: pick(options.facialHair.length, hash, 12),
    accessory: pick(options.accessories.length, hash, 14),
    expression: pick(options.expressions.length, hash, 15),
  };
}

function clampIndex(value: number, length: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), length - 1);
}

function normalize(config: AvatarConfig): AvatarConfig {
  return {
    version: options.version,
    palette: clampIndex(config.palette, options.palettes.length),
    skinTone: clampIndex(config.skinTone, options.skinTones.length),
    hairStyle: clampIndex(config.hairStyle, options.hairStyles.length),
    hairColor: clampIndex(config.hairColor, options.hairColors.length),
    clothes: clampIndex(config.clothes, options.clothes.length),
    eyes: clampIndex(config.eyes, options.eyes.length),
    facialHair: clampIndex(config.facialHair, options.facialHair.length),
    accessory: clampIndex(config.accessory, options.accessories.length),
    expression: clampIndex(config.expression, options.expressions.length),
  };
}

function hairSvg(style: string, color: string, skin: string): string {
  if (style === "bald") {
    return `<circle cx="64" cy="50" r="29" fill="${skin}"/>`;
  }
  if (style === "bob") {
    return `<path d="M33 56c0-22 13-35 31-35s31 13 31 35v20H64l-31-1z" fill="${color}"/><circle cx="64" cy="52" r="27" fill="${skin}"/>`;
  }
  if (style === "curly") {
    return `<circle cx="43" cy="38" r="14" fill="${color}"/><circle cx="64" cy="28" r="16" fill="${color}"/><circle cx="85" cy="38" r="14" fill="${color}"/><circle cx="64" cy="52" r="27" fill="${skin}"/>`;
  }
  if (style === "bun") {
    return `<circle cx="64" cy="20" r="12" fill="${color}"/><path d="M35 53c2-19 14-29 29-29s27 10 29 29c-8-7-18-10-29-10s-21 3-29 10z" fill="${color}"/><circle cx="64" cy="53" r="27" fill="${skin}"/>`;
  }
  return `<path d="M35 52c1-19 14-30 29-30s28 11 29 30c-8-8-18-11-29-11s-21 3-29 11z" fill="${color}"/><circle cx="64" cy="52" r="27" fill="${skin}"/>`;
}

function facialHairSvg(style: string, color: string): string {
  if (style === "beard") {
    return `<path d="M42 62c2 21 11 30 22 30s20-9 22-30c-6 8-13 12-22 12s-16-4-22-12z" fill="${color}" opacity="0.9"/>`;
  }
  if (style === "stubble") {
    return `<path d="M45 66c4 13 10 19 19 19s15-6 19-19c-5 5-11 8-19 8s-14-3-19-8z" fill="${color}" opacity="0.35"/>`;
  }
  return "";
}

function accessorySvg(style: string, accent: string, skin: string): string {
  if (style === "glasses") {
    return `<rect x="43" y="51" width="16" height="11" rx="3" fill="none" stroke="${accent}" stroke-width="2"/><rect x="69" y="51" width="16" height="11" rx="3" fill="none" stroke="${accent}" stroke-width="2"/><path d="M59 56h10" stroke="${accent}" stroke-width="2"/>`;
  }
  if (style === "roundGlasses") {
    return `<circle cx="50" cy="56" r="8" fill="none" stroke="${accent}" stroke-width="2"/><circle cx="78" cy="56" r="8" fill="none" stroke="${accent}" stroke-width="2"/><path d="M58 56h12" stroke="${accent}" stroke-width="2"/>`;
  }
  if (style === "earrings") {
    return `<circle cx="34" cy="63" r="3" fill="${accent}"/><circle cx="94" cy="63" r="3" fill="${accent}"/><rect x="54" y="42" width="20" height="2" rx="1" fill="${skin}"/>`;
  }
  return "";
}

function clothesSvg(style: string, shirt: string, accent: string): string {
  if (style === "hoodie") {
    return `<path d="M16 128c2-25 20-40 48-40s46 15 48 40z" fill="${shirt}"/><path d="M42 98c6-8 13-11 22-11s16 3 22 11" fill="none" stroke="${accent}" stroke-width="3"/>`;
  }
  if (style === "jacket") {
    return `<path d="M24 128c2-23 18-37 40-37s38 14 40 37z" fill="${shirt}"/><path d="M64 92v36" stroke="${accent}" stroke-width="2"/><path d="M52 96l12 12 12-12" fill="none" stroke="${accent}" stroke-width="2"/>`;
  }
  return `<path d="M24 128c2-23 18-37 40-37s38 14 40 37z" fill="${shirt}"/>`;
}

function eyesSvg(style: string): string {
  if (style === "happy") {
    return `<path d="M49 63c2-3 5-3 7 0M72 63c2-3 5-3 7 0" fill="none" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (style === "wink") {
    return `<circle cx="54" cy="62" r="2" fill="#3E2723"/><path d="M71 62h8" stroke="#3E2723" stroke-width="2" stroke-linecap="round"/>`;
  }
  return `<circle cx="54" cy="62" r="2" fill="#3E2723"/><circle cx="74" cy="62" r="2" fill="#3E2723"/>`;
}

function expressionSvg(style: string): string {
  if (style === "grin") {
    return `<path d="M54 70c4 7 16 7 20 0" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (style === "neutral") {
    return `<path d="M56 72h16" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>`;
  }
  return `<path d="M55 68c5 6 13 6 18 0" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>`;
}

export function renderAvatarSvg(input: AvatarConfig): string {
  const config = normalize(input);
  const palette = options.palettes[config.palette];
  const skin = options.skinTones[config.skinTone];
  const hair = options.hairColors[config.hairColor];
  const hairStyle = options.hairStyles[config.hairStyle];
  const clothes = options.clothes[config.clothes];
  const eyes = options.eyes[config.eyes];
  const facialHair = options.facialHair[config.facialHair];
  const accessory = options.accessories[config.accessory];
  const expression = options.expressions[config.expression];

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`,
    `<rect width="128" height="128" rx="64" fill="${palette.background}"/>`,
    clothesSvg(clothes, palette.shirt, palette.accent),
    hairSvg(hairStyle, hair, skin),
    facialHairSvg(facialHair, hair),
    eyesSvg(eyes),
    expressionSvg(expression),
    `<path d="M58 64h12v8H58z" fill="${skin}" opacity="0.6"/>`,
    accessorySvg(accessory, palette.accent, skin),
    `</svg>`,
  ].join("");
}

export function avatarDataUri(config: AvatarConfig): string {
  return `data:image/svg+xml,${encodeURIComponent(renderAvatarSvg(config))}`;
}

export function createDefaultAvatar(seed: string): string {
  return avatarDataUri(defaultAvatarConfig(seed));
}

export function isAvatarDataUri(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("data:image/svg+xml,") && value.length <= AVATAR_MAX_LENGTH);
}
