import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

function Banner({ message, tone }: { message: string; tone: "error" | "success" | "info" }) {
  const { colors } = useTheme();
  const palette = {
    error: { background: colors.errorContainer, text: colors.onErrorContainer },
    success: { background: colors.successContainer, text: colors.onSuccessContainer },
    info: { background: colors.surfaceContainerHigh, text: colors.onSurface },
  }[tone];

  return (
    <View
      accessible
      accessibilityRole={tone === "error" ? "alert" : undefined}
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      style={[styles.banner, { backgroundColor: palette.background }]}
    >
      <Text style={[typeStyle("bodyMedium"), { color: palette.text }]}>{message}</Text>
    </View>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner message={message} tone="error" />;
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner message={message} tone="success" />;
}

export function InlineBanner({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "error" | "success" | "info";
}) {
  return <Banner message={message} tone={tone} />;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: shape.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
});
