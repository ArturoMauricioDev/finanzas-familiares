import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { spacing } from "../../lib/generated/tokens";

export function List({ children }: { children: ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

export function ListItem({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.item, { borderBottomColor: colors.outlineVariant }]}>{children}</View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="none"
      style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});