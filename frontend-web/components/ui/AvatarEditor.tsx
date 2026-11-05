"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import {
  avatarDataUri,
  defaultAvatarConfig,
  hashString,
  type AvatarConfig,
} from "@/lib/avatar-engine.generated";
import { avatarOptions } from "@/lib/avatar-options.generated";
import { Button } from "./Button";
import { Select } from "./Select";

function optionLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  value: string,
): string {
  const key = `avatar.options.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

export function AvatarEditor({
  seed,
  initial,
  onApply,
}: {
  seed: string;
  initial?: AvatarConfig;
  onApply?: (dataUri: string) => void;
}) {
  const { t } = useI18n();
  const [config, setConfig] = useState<AvatarConfig>(initial ?? defaultAvatarConfig(seed));
  const dataUri = useMemo(() => avatarDataUri(config), [config]);

  const numberOptions = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      value: String(index),
      label: t("avatar.options.optionValue", { value: index + 1 }),
    }));

  const update = (patch: Partial<AvatarConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
      <div className="space-y-3">
        <Image
          src={dataUri}
          alt={t("avatar.previewAlt")}
          width={192}
          height={192}
          unoptimized
          className="h-48 w-48 rounded-full bg-surface-container"
        />
        <p className="text-body-small text-on-surface-variant">{t("avatar.previewOnly")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label={t("avatar.skin")}
          value={String(config.skinTone)}
          options={numberOptions(avatarOptions.skinTones.length)}
          onChange={(event) => update({ skinTone: Number(event.target.value) })}
        />
        <Select
          label={t("avatar.hair")}
          value={String(config.hairStyle)}
          options={avatarOptions.hairStyles.map((value, index) => ({
            value: String(index),
            label: optionLabel(t, value),
          }))}
          onChange={(event) => update({ hairStyle: Number(event.target.value) })}
        />
        <Select
          label={t("avatar.hairColor")}
          value={String(config.hairColor)}
          options={numberOptions(avatarOptions.hairColors.length)}
          onChange={(event) => update({ hairColor: Number(event.target.value) })}
        />
        <Select
          label={t("avatar.facialHair")}
          value={String(config.facialHair)}
          options={avatarOptions.facialHair.map((value, index) => ({
            value: String(index),
            label: optionLabel(t, value),
          }))}
          onChange={(event) => update({ facialHair: Number(event.target.value) })}
        />
        <Select
          label={t("avatar.accessory")}
          value={String(config.accessory)}
          options={avatarOptions.accessories.map((value, index) => ({
            value: String(index),
            label: optionLabel(t, value),
          }))}
          onChange={(event) => update({ accessory: Number(event.target.value) })}
        />
        <Select
          label={t("avatar.expression")}
          value={String(config.expression)}
          options={avatarOptions.expressions.map((value, index) => ({
            value: String(index),
            label: optionLabel(t, value),
          }))}
          onChange={(event) => update({ expression: Number(event.target.value) })}
        />
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button
            variant="secondary"
            onClick={() => setConfig(defaultAvatarConfig(`${seed}-${Date.now()}`))}
          >
            {t("avatar.randomize")}
          </Button>
          {onApply ? (
            <Button onClick={() => onApply(dataUri)}>{t("avatar.apply")}</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
