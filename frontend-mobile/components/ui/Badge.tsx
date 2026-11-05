import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const palette = {
    neutral: { background: colors.surfaceContainerHigh, text: colors.onSurface },
    primary: { background: colors.primaryContainer, text: colors.onPrimaryContainer },
    success: { background: colors.successContainer, text: colors.onSuccessContainer },
    warning: { background: colors.warningContainer, text: colors.onWarningContainer },
    danger: { background: colors.errorContainer, text: colors.onErrorContainer },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[typeStyle("labelSmall"), { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: shape.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0],
  },
});