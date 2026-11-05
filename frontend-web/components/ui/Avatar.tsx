"use client";

import Image from "next/image";

import { createDefaultAvatar } from "@/lib/avatar-engine.generated";
import { useI18n } from "@/components/providers/LocaleProvider";

const sizePixels = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
} as const;

export function Avatar({
  name,
  src,
  seed,
  size = "md",
  className,
}: {
  name?: string | null;
  src?: string | null;
  seed?: string | null;
  size?: keyof typeof sizePixels;
  className?: string;
}) {
  const { t } = useI18n();
  const pixels = sizePixels[size];
  const resolvedSeed = seed || name || "kitho";
  const source = src || createDefaultAvatar(resolvedSeed);
  const label = name ? `${t("a11y.avatar")} ${name}` : t("a11y.avatar");

  return (
    <Image
      src={source}
      alt={label}
      width={pixels}
      height={pixels}
      unoptimized
      className={["shrink-0 rounded-full bg-surface-container object-cover", className ?? ""].join(" ")}
      style={{ width: pixels, height: pixels }}
    />
  );
}
