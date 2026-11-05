import { ActivityIndicator } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <ActivityIndicator
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? t("a11y.loading")}
      color={colors.primary}
    />
  );
}