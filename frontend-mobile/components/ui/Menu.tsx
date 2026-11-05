import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void;
}

export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel={label} style={[styles.menu, { borderColor: colors.outlineVariant }]}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={item.onSelect}
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surface },
          ]}
        >
          <Text style={[typeStyle("bodyMedium"), { color: colors.onSurface }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    borderWidth: 1,
    borderRadius: shape.sm,
    overflow: "hidden",
  },
  item: {
    minHeight: touchTarget.min,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
  },
});