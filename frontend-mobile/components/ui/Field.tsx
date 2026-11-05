import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={colors.onSurfaceVariant}
        style={[
          styles.input,
          typeStyle("bodyLarge"),
          {
            color: colors.onSurface,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.outline,
          },
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[typeStyle("bodySmall"), { color: colors.error }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

export const TextField = Field;

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  input: {
    minHeight: touchTarget.min,
    borderWidth: 1,
    borderRadius: shape.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
