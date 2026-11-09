"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { ErrorMessage, SearchField, Select } from "@/components/ui";
import { searchCurrencies, type CurrencyOption } from "@/lib/currency";

const otherValue = "__other__";

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
  const [showOther, setShowOther] = useState(false);
  const [query, setQuery] = useState(searchQuery);

  const options = useMemo(
    () => [
      ...suggestions.map((option) => ({
        value: option.code,
        label: optionLabel(option, t("family.currencyLocalBadge")),
      })),
      { value: otherValue, label: t("family.currencyOther") },
    ],
    [suggestions, t],
  );

  const otherResults = useMemo(() => {
    if (!showOther) return [];
    return searchCurrencies(query, formatLocale).slice(0, 12);
  }, [formatLocale, query, showOther]);

  const handleQuery = (next: string) => {
    setQuery(next);
    onSearch?.(next);
  };

  return (
    <div className="space-y-2">
      <Select
        label={label}
        value={showOther ? otherValue : value}
        options={options}
        disabled={disabled || loading}
        onChange={(event) => {
          const next = event.target.value;
          if (next === otherValue) {
            setShowOther(true);
            return;
          }
          setShowOther(false);
          onChange(next);
        }}
      />

      {localCode ? (
        <p className="text-body-small text-on-surface-variant" role="status">
          {t("family.currencyDetected", {
            currency: localCode,
          })}
        </p>
      ) : null}

      {loading ? (
        <p className="text-body-small text-on-surface-variant" role="status">
          {t("family.currencyLoading")}
        </p>
      ) : null}

      <ErrorMessage message={error} />

      {showOther ? (
        <div className="space-y-3 rounded-sm border border-outline-variant p-3">
          <SearchField
            label={t("family.currencySearchLabel")}
            placeholder={t("family.currencySearchPlaceholder")}
            value={query}
            onChange={(event) => handleQuery(event.target.value)}
          />
          {otherResults.length ? (
            <ul role="listbox" aria-label={t("family.currencySearchLabel")} className="max-h-64 overflow-y-auto">
              {otherResults.map((option) => (
                <li key={option.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.code === value}
                    className="min-h-12 w-full rounded-sm px-3 text-left text-body-large text-on-surface hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    onClick={() => {
                      onChange(option.code);
                      setShowOther(false);
                    }}
                  >
                    {optionLabel(option, t("family.currencyLocalBadge"))}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-small text-on-surface-variant">
              {t("family.currencyNoResults")}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
