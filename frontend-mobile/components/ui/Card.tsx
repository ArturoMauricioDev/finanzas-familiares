import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { elevationStyle } from "../../lib/ui-styles";

export function Card({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        elevationStyle("1"),
        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: shape.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    gap: spacing[3],
  },
});
