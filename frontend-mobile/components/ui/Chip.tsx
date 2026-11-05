import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function Chip({
  label,
  selected = false,
  onPress,
  children,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.secondaryContainer : colors.outlineVariant,
          backgroundColor: selected ? colors.secondaryContainer : colors.surface,
        },
      ]}
    >
      {children}
      <Text
        style={[
          typeStyle("labelMedium"),
          { color: selected ? colors.onSecondaryContainer : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    borderRadius: shape.full,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
  },
});