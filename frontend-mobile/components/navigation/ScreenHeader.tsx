import { ArrowLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function ScreenHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          onPress={onBack}
          style={styles.back}
        >
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
      ) : null}
      <Text accessibilityRole="header" style={[typeStyle("titleLarge"), styles.title, { color: colors.onSurface }]}>
        {title}
      </Text>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: touchTarget.min,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: 48,
    paddingBottom: spacing[2],
  },
  back: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  title: {
    flex: 1,
  },
});
