import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
}

export function Breadcrumbs({
  items,
  label = "Ruta de navegación",
}: {
  items: BreadcrumbItem[];
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel={label} style={styles.row}>
      {items.map((item, index) => {
        const current = index === items.length - 1;
        return (
          <View key={`${item.label}-${index}`} style={styles.row}>
            {item.onPress && !current ? (
              <Pressable accessibilityRole="link" accessibilityLabel={item.label} onPress={item.onPress}>
                <Text style={[typeStyle("bodySmall"), { color: colors.primary }]}>{item.label}</Text>
              </Pressable>
            ) : (
              <Text
                accessibilityRole={current ? "text" : undefined}
                style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}
              >
                {item.label}
              </Text>
            )}
            {current ? null : (
              <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>/</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[2],
  },
});