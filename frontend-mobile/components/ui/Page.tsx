import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../providers/ThemeProvider";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { ScreenHeader } from "../navigation/ScreenHeader";

export function Page({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        {
          backgroundColor: colors.surface,
          paddingTop: onBack ? 0 : insets.top + spacing[5],
          paddingBottom: spacing[12] + insets.bottom,
        },
        onBack ? styles.pageWithHeader : null,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {onBack ? (
        <ScreenHeader title={title} onBack={onBack} />
      ) : (
        <View>
          <Text accessibilityRole="header" style={[typeStyle("headlineMedium"), { color: colors.onSurface }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[typeStyle("bodyLarge"), { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
          ) : null}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: spacing[5],
    minHeight: "100%",
    gap: spacing[4],
  },
  pageWithHeader: {
    paddingTop: 0,
  },
  content: {
    gap: spacing[4],
  },
});
