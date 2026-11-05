import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { Button } from "./Button";

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value)?.label ?? value;

  return (
    <View style={styles.root}>
      <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: colors.outline }]}
      >
        <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>{current}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.panel, { backgroundColor: colors.surface }]}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    { backgroundColor: selected ? colors.secondaryContainer : "transparent" },
                  ]}
                >
                  <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
            <Button title={t("common.close")} variant="text" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[2],
  },
  trigger: {
    minHeight: touchTarget.min,
    justifyContent: "center",
    borderRadius: shape.sm,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: spacing[4],
  },
  panel: {
    borderRadius: shape.lg,
    padding: spacing[4],
    gap: spacing[2],
  },
  option: {
    minHeight: touchTarget.min,
    justifyContent: "center",
    borderRadius: shape.sm,
    paddingHorizontal: spacing[3],
  },
});