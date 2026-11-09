import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { searchCurrencies, type CurrencyOption } from "../../lib/currency";
import { shape, spacing, touchTarget } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/InlineBanner";
import { SearchField } from "../ui/SearchField";

export interface CurrencySelectProps {
  label: string;
  value: string;
  suggestions: CurrencyOption[];
  localCode?: string | null;
  onChange: (code: string) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

function optionLabel(option: CurrencyOption, localLabel: string): string {
  return option.isLocal
    ? `${option.code} — ${option.name} (${localLabel})`
    : `${option.code} — ${option.name}`;
}

export function CurrencySelect({
  label,
  value,
  suggestions,
  localCode,
  onChange,
  onSearch,
  searchQuery = "",
  loading = false,
  error,
  disabled = false,
}: CurrencySelectProps) {
  const { formatLocale, t } = useI18n();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchQuery);

  const current =
    suggestions.find((option) => option.code === value)?.name ?? value;
  const otherResults = useMemo(
    () => (query.trim() ? searchCurrencies(query, formatLocale).slice(0, 12) : []),
    [formatLocale, query],
  );

  const select = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.root}>
      <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current}`}
        accessibilityState={{ expanded: open, disabled: disabled || loading }}
        disabled={disabled || loading}
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: error ? colors.error : colors.outline }]}
      >
        <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>
          {loading ? t("family.currencyLoading") : current}
        </Text>
      </Pressable>
      {localCode ? (
        <Text accessibilityLiveRegion="polite" style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
          {t("family.currencyDetected", { currency: localCode })}
        </Text>
      ) : null}
      <ErrorMessage message={error} />

      <Modal
        visible={open}
        transparent
        animationType={reducedMotion ? "none" : "fade"}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: 0.4 }]}
          />
          <View accessibilityViewIsModal style={[styles.panel, { backgroundColor: colors.surface }]}>
            <Text accessibilityRole="header" style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
              {label}
            </Text>
            <ScrollView style={styles.list}>
              {suggestions.map((option) => {
                const selected = option.code === value;
                return (
                  <Pressable
                    key={option.code}
                    accessibilityRole="button"
                    accessibilityLabel={optionLabel(option, t("family.currencyLocalBadge"))}
                    accessibilityState={{ selected }}
                    onPress={() => select(option.code)}
                    style={[
                      styles.option,
                      { backgroundColor: selected ? colors.secondaryContainer : "transparent" },
                    ]}
                  >
                    <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>
                      {optionLabel(option, t("family.currencyLocalBadge"))}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <SearchField
              label={t("family.currencySearchLabel")}
              placeholder={t("family.currencySearchPlaceholder")}
              value={query}
              onChangeText={(next) => {
                setQuery(next);
                onSearch?.(next);
              }}
              autoCapitalize="characters"
            />
            {query.trim() ? (
              <ScrollView style={styles.list}>
                {otherResults.map((option) => (
                  <Pressable
                    key={option.code}
                    accessibilityRole="button"
                    accessibilityLabel={optionLabel(option, t("family.currencyLocalBadge"))}
                    accessibilityState={{ selected: option.code === value }}
                    onPress={() => select(option.code)}
                    style={[styles.option, { backgroundColor: colors.surfaceContainerHigh }]}
                  >
                    <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>
                      {optionLabel(option, t("family.currencyLocalBadge"))}
                    </Text>
                  </Pressable>
                ))}
                {otherResults.length === 0 ? (
                  <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
                    {t("family.currencyNoResults")}
                  </Text>
                ) : null}
              </ScrollView>
            ) : null}
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
    padding: spacing[4],
  },
  panel: {
    maxHeight: "90%",
    borderRadius: shape.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  list: {
    maxHeight: 240,
  },
  option: {
    minHeight: touchTarget.min,
    justifyContent: "center",
    borderRadius: shape.sm,
    paddingHorizontal: spacing[3],
  },
});
