import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../providers/ThemeProvider";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

export interface TabItem {
  id: string;
  label: string;
}

export function Tabs({
  items,
  value,
  onChange,
  children,
}: {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const [internal, setInternal] = useState(items[0]?.id ?? "");
  const active = value ?? internal;

  const select = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };

  return (
    <View style={styles.root}>
      <View accessibilityRole="tablist" style={[styles.tablist, { borderColor: colors.outlineVariant }]}>
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => select(item.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? colors.secondaryContainer : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  typeStyle("labelLarge"),
                  { color: selected ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: spacing[3],
  },
  tablist: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing[2],
  },
  tab: {
    minHeight: touchTarget.min,
    justifyContent: "center",
    borderRadius: shape.full,
    paddingHorizontal: spacing[4],
  },
});