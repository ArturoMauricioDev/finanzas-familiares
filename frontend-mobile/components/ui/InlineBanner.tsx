import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

function Banner({
  message,
  tone,
  action,
}: {
  message: string;
  tone: "error" | "success" | "info";
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  const palette = {
    error: { background: colors.errorContainer, text: colors.onErrorContainer },
    success: { background: colors.successContainer, text: colors.onSuccessContainer },
    info: { background: colors.surfaceContainerHigh, text: colors.onSurface },
  }[tone];

  return (
    <View style={[styles.banner, { backgroundColor: palette.background }]}>
      <View style={styles.row}>
        <Text
          accessibilityRole={tone === "error" ? "alert" : undefined}
          accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
          style={[typeStyle("bodyMedium"), styles.message, { color: palette.text }]}
        >
          {message}
        </Text>
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

export function ErrorMessage({
  message,
  action,
}: {
  message?: string | null;
  action?: ReactNode;
}) {
  if (!message) return null;
  return <Banner message={message} tone="error" action={action} />;
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner message={message} tone="success" />;
}

export function InlineBanner({
  message,
  tone = "info",
  action,
}: {
  message: string;
  tone?: "error" | "success" | "info";
  action?: ReactNode;
}) {
  return <Banner message={message} tone={tone} action={action} />;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: shape.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  message: {
    flex: 1,
  },
  action: {
    flexShrink: 0,
  },
});
