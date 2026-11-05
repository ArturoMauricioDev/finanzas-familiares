import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import {
  avatarDataUri,
  defaultAvatarConfig,
  renderAvatarSvg,
  type AvatarConfig,
} from "../../lib/avatar-engine.generated";
import { avatarOptions } from "../../lib/avatar-options.generated";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { Button } from "./Button";
import { InlineBanner } from "./InlineBanner";

function labelFor(t: (key: string) => string, value: string): string {
  const key = `avatar.options.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

function ChoiceRow({
  label,
  count,
  value,
  labels,
  colors,
  onChange,
}: {
  label: string;
  count: number;
  value: number;
  labels?: readonly string[];
  colors?: readonly string[];
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.control}>
      <Text style={[typeStyle("labelLarge"), { color: theme.colors.onSurface }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {Array.from({ length: count }, (_, index) => {
          const selected = index === value;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={labels?.[index] ?? `${label} ${index + 1}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(index)}
              style={({ pressed }) => [
                styles.choice,
                {
                  borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
                  backgroundColor: selected
                    ? theme.colors.secondaryContainer
                    : pressed
                      ? theme.colors.surfaceContainerHigh
                      : theme.colors.surface,
                },
              ]}
            >
              {colors ? (
                <View style={[styles.swatch, { backgroundColor: colors[index] }]} />
              ) : (
                <Text
                  style={[
                    typeStyle("labelMedium"),
                    { color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurface },
                  ]}
                >
                  {labels?.[index] ?? String(index + 1)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function AvatarEditor({
  seed,
  initial,
  onApply,
  onDirtyChange,
}: {
  seed: string;
  initial?: AvatarConfig;
  onApply?: (dataUri: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [config, setConfig] = useState<AvatarConfig>(initial ?? defaultAvatarConfig(seed));
  const [notice, setNotice] = useState(false);
  const svg = useMemo(() => renderAvatarSvg(config), [config]);
  const dataUri = useMemo(() => avatarDataUri(config), [config]);

  const update = (patch: Partial<AvatarConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
    setNotice(false);
    onDirtyChange?.(true);
  };

  const randomize = () => {
    setConfig(defaultAvatarConfig(`${seed}-${Date.now()}`));
    setNotice(false);
    onDirtyChange?.(true);
  };

  return (
    <View style={styles.root}>
      <SvgXml xml={svg} width={192} height={192} accessibilityLabel={t("avatar.previewAlt")} />
      <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
        {t("avatar.previewOnly")}
      </Text>

      <ChoiceRow
        label={t("avatar.background")}
        count={avatarOptions.palettes.length}
        value={config.palette}
        labels={avatarOptions.palettes.map((palette) => labelFor(t, palette.id))}
        onChange={(palette) => update({ palette })}
      />
      <ChoiceRow
        label={t("avatar.skin")}
        count={avatarOptions.skinTones.length}
        value={config.skinTone}
        colors={avatarOptions.skinTones}
        onChange={(skinTone) => update({ skinTone })}
      />
      <ChoiceRow
        label={t("avatar.hair")}
        count={avatarOptions.hairStyles.length}
        value={config.hairStyle}
        labels={avatarOptions.hairStyles.map((value) => labelFor(t, value))}
        onChange={(hairStyle) => update({ hairStyle })}
      />
      <ChoiceRow
        label={t("avatar.hairColor")}
        count={avatarOptions.hairColors.length}
        value={config.hairColor}
        colors={avatarOptions.hairColors}
        onChange={(hairColor) => update({ hairColor })}
      />
      <ChoiceRow
        label={t("avatar.clothes")}
        count={avatarOptions.clothes.length}
        value={config.clothes}
        labels={avatarOptions.clothes.map((value) => labelFor(t, value))}
        onChange={(clothes) => update({ clothes })}
      />
      <ChoiceRow
        label={t("avatar.eyes")}
        count={avatarOptions.eyes.length}
        value={config.eyes}
        labels={avatarOptions.eyes.map((value) => labelFor(t, value))}
        onChange={(eyes) => update({ eyes })}
      />
      <ChoiceRow
        label={t("avatar.facialHair")}
        count={avatarOptions.facialHair.length}
        value={config.facialHair}
        labels={avatarOptions.facialHair.map((value) => labelFor(t, value))}
        onChange={(facialHair) => update({ facialHair })}
      />
      <ChoiceRow
        label={t("avatar.accessory")}
        count={avatarOptions.accessories.length}
        value={config.accessory}
        labels={avatarOptions.accessories.map((value) => labelFor(t, value))}
        onChange={(accessory) => update({ accessory })}
      />
      <ChoiceRow
        label={t("avatar.expression")}
        count={avatarOptions.expressions.length}
        value={config.expression}
        labels={avatarOptions.expressions.map((value) => labelFor(t, value))}
        onChange={(expression) => update({ expression })}
      />

      {notice ? <InlineBanner message={t("avatar.saveUnavailable")} tone="info" /> : null}

      <View style={styles.actions}>
        <Button title={t("avatar.randomize")} variant="secondary" onPress={randomize} />
        <Button title={t("common.save")} onPress={() => setNotice(true)} />
        {onApply ? (
          <Button title={t("avatar.apply")} variant="tonal" onPress={() => onApply(dataUri)} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[4],
    alignItems: "center",
  },
  control: {
    width: "100%",
    gap: spacing[2],
  },
  choices: {
    gap: spacing[2],
  },
  choice: {
    minWidth: spacing[12],
    minHeight: spacing[12],
    borderRadius: shape.full,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: spacing[6],
    height: spacing[6],
    borderRadius: shape.full,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    justifyContent: "center",
  },
});