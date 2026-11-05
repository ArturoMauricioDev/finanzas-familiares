import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export interface BreadcrumbItem {
  label: string;
  onPress?: () => void;
}

export function Breadcrumbs({
  items,
  label,
}: {
  items: BreadcrumbItem[];
  label?: string;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navLabel = label ?? t("a11y.breadcrumbs");
  return (
    <View accessibilityLabel={navLabel} style={styles.row}>
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