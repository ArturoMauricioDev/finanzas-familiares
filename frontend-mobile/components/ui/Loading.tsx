import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { useI18n } from "../providers/LocaleProvider";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function Loading({ message }: { message?: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? t("a11y.loading")}
      accessibilityLiveRegion="polite"
      style={styles.loading}
    >
      <ActivityIndicator color={colors.primary} />
      <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
        {message ?? t("app.loading")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    padding: spacing[6],
  },
});
