"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorMessage,
  Page,
  RadioGroup,
  SuccessMessage,
} from "@/components/ui";
import { api } from "@/lib/api";
import { brand } from "@/lib/generated/tokens";
import type { Locale } from "@/lib/i18n/messages.generated";
import type { ThemePreference } from "@/lib/preferences";
import { clearSession } from "@/lib/session";

const APP_VERSION = "0.1.0";

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const changeTheme = (value: string) => {
    theme.setMode(value as ThemePreference);
    setMessageKey("settings.themeChanged");
  };

  const changeLocale = (value: string) => {
    setLocale(value as Locale);
    setMessageKey("settings.localeChanged");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await api.deleteAccount();
      clearSession();
      router.replace("/auth/login");
    } catch {
      setDeleteFailed(true);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Page title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <SuccessMessage message={messageKey ? t(messageKey) : null} />

      <Card variant="outlined" className="space-y-4">
        <div>
          <h2 className="text-title-large text-on-surface">{t("settings.appearanceHeading")}</h2>
          <p className="text-body-medium text-on-surface-variant">{t("settings.appearanceBody")}</p>
        </div>
        <RadioGroup
          name="theme"
          legend={t("common.appearance")}
          value={theme.mode}
          onChange={changeTheme}
          options={[
            { value: "system", label: t("common.system") },
            { value: "light", label: t("common.light") },
            { value: "dark", label: t("common.dark") },
          ]}
        />
      </Card>

      <Card variant="outlined" className="space-y-4">
        <div>
          <h2 className="text-title-large text-on-surface">{t("settings.languageHeading")}</h2>
          <p className="text-body-medium text-on-surface-variant">{t("settings.languageBody")}</p>
        </div>
        <RadioGroup
          name="locale"
          legend={t("common.language")}
          value={locale}
          onChange={changeLocale}
          options={[
            { value: "es", label: t("common.spanish") },
            { value: "en", label: t("common.english") },
          ]}
        />
      </Card>

      <Card variant="outlined" className="space-y-4">
        <div>
          <h2 className="text-title-large text-on-surface">{t("settings.accountHeading")}</h2>
          <p className="text-body-medium text-on-surface-variant">{t("settings.deleteAccountBody")}</p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}>
            {t("settings.deleteAccount")}
          </Button>
          <ErrorMessage message={deleteFailed ? t("settings.deleteAccountFailed") : null} />
        </div>
      </Card>

      <Card variant="filled" className="space-y-2">
        <h2 className="text-title-large text-on-surface">{t("settings.aboutHeading")}</h2>
        <p className="text-body-medium text-on-surface-variant">{t("settings.aboutBody")}</p>
        <p className="text-label-medium text-on-surface-variant">
          {t("settings.version", { version: APP_VERSION })} · {brand.name}
        </p>
      </Card>

      <Card variant="outlined" className="space-y-2">
        <h2 className="text-title-large text-on-surface">{t("legal.title")}</h2>
        <p className="text-body-medium text-on-surface-variant">{t("legal.body")}</p>
        <Link
          href="/legal"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full px-4 text-label-large font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("legal.linkLabel")}
        </Link>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title={t("settings.deleteAccountConfirmTitle")}
        description={t("settings.deleteAccountConfirmBody")}
        confirmLabel={t("settings.deleteAccount")}
        cancelLabel={t("common.cancel")}
        destructive
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void deleteAccount()}
      />
    </Page>
  );
}
