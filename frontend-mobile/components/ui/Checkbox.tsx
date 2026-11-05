import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function Checkbox({
  label,
  checked = false,
  onPress,
}: {
  label: string;
  checked?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? colors.primary : colors.outline,
            backgroundColor: checked ? colors.primary : "transparent",
          },
        ]}
      >
        {checked ? (
          <Text style={[typeStyle("labelMedium"), { color: colors.onPrimary }]}>✓</Text>
        ) : null}
      </View>
      <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  box: {
    width: spacing[5],
    height: spacing[5],
    borderRadius: shape.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});