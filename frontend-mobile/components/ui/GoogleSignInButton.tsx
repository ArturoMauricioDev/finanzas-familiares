import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { googleBrandColors } from "./google-brand";

export function GoogleSignInButton({
  onPress,
  disabled,
  loading,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("auth.continueWithGoogle")}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.logo}>
        <Svg width={20} height={20} viewBox="0 0 48 48">
          <Path
            fill={googleBrandColors.blue}
            d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
          />
          <Path
            fill={googleBrandColors.green}
            d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
          />
          <Path
            fill={googleBrandColors.yellow}
            d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
          />
          <Path
            fill={googleBrandColors.red}
            d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
          />
        </Svg>
      </View>
      <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>
        {t("auth.continueWithGoogle")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.min,
    borderWidth: 1,
    borderRadius: shape.full,
    paddingHorizontal: spacing[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  logo: {
    width: 20,
    height: 20,
  },
});
