import type { ReactNode } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { Button } from "./Button";

export function Dialog({
  open,
  title,
  children,
  onClose,
  closeLabel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          accessibilityViewIsModal
          style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
        >
          <Text accessibilityRole="header" style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {title}
          </Text>
          {children}
          <View style={styles.actions}>
            <Button title={closeLabel} variant="text" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing[4],
  },
  panel: {
    borderRadius: shape.lg,
    borderWidth: 1,
    padding: spacing[5],
    gap: spacing[4],
  },
  actions: {
    alignItems: "flex-end",
  },
});
