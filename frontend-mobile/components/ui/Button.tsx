import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export type ButtonVariant = "primary" | "secondary" | "tonal" | "text" | "danger";

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const palette = {
    primary: { background: colors.primary, text: colors.onPrimary, border: colors.primary },
    secondary: { background: "transparent", text: colors.primary, border: colors.outline },
    tonal: {
      background: colors.secondaryContainer,
      text: colors.onSecondaryContainer,
      border: colors.secondaryContainer,
    },
    text: { background: "transparent", text: colors.primary, border: "transparent" },
    danger: { background: colors.error, text: colors.onError, border: colors.error },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={palette.text} size="small" /> : null}
      <Text style={[typeStyle("labelLarge"), { color: palette.text }]}>
        {loading ? t("common.saving") : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.min,
    borderRadius: shape.full,
    borderWidth: 1,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing[2],
  },
});
