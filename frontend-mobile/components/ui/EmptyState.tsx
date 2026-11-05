import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
      ]}
    >
      {icon}
      <Text style={[typeStyle("titleMedium"), { color: colors.onSurface }]}>{title}</Text>
      <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant, textAlign: "center" }]}>
        {description}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: shape.lg,
    padding: spacing[6],
    gap: spacing[2],
  },
});
