import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export function ChoiceGroup({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={legend} style={styles.group}>
      <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>{legend}</Text>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.outlineVariant,
                backgroundColor: selected ? colors.secondaryContainer : colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.radio,
                { borderColor: selected ? colors.primary : colors.outline },
              ]}
            >
              {selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
            </View>
            <View style={styles.copy}>
              <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>{option.label}</Text>
              {option.description ? (
                <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
                  {option.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[2],
  },
  option: {
    minHeight: touchTarget.min,
    borderWidth: 1,
    borderRadius: shape.md,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  radio: {
    width: spacing[5],
    height: spacing[5],
    borderRadius: shape.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: shape.full,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
});
