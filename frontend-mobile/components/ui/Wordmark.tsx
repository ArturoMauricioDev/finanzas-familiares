import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { colors } = useTheme();
  const markSize = size === "lg" ? 44 : size === "sm" ? 28 : 36;
  const textStyle = size === "lg" ? "headlineSmall" : size === "sm" ? "titleMedium" : "titleLarge";
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          {
            width: markSize,
            height: markSize,
            borderRadius: shape.sm,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text style={[typeStyle("titleMedium"), { color: colors.onPrimary }]}>K</Text>
      </View>
      <Text style={[typeStyle(textStyle), { color: colors.onSurface }]}>Kitho</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
});
