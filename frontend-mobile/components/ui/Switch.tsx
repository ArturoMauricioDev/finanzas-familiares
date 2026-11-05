import { StyleSheet, Switch as NativeSwitch, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function Switch({
  label,
  value = false,
  onValueChange,
}: {
  label: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>{label}</Text>
      <NativeSwitch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
        thumbColor={colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
});