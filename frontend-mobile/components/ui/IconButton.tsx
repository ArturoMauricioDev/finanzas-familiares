import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { touchTarget } from "../../lib/generated/tokens";

export type IconButtonTone = "default" | "primary" | "danger";

export function IconButton({
  label,
  onPress,
  disabled,
  loading,
  tone = "default",
  children,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: IconButtonTone;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const tint = {
    default: colors.onSurfaceVariant,
    primary: colors.primary,
    danger: colors.error,
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={tint} size="small" /> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.min,
    minWidth: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
});
