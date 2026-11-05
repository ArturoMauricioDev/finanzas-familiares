"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button, Card, ConfirmDialog, Page, RadioGroup, SuccessMessage } from "@/components/ui";
import { brand } from "@/lib/generated/tokens";
import type { Locale } from "@/lib/i18n/messages.generated";
import type { ThemePreference } from "@/lib/preferences";
import { clearSession } from "@/lib/session";

const APP_VERSION = "0.1.0";

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const changeTheme = (value: string) => {
    theme.setMode(value as ThemePreference);
    setMessage(t("settings.themeChanged"));
  };

  const changeLocale = (value: string) => {
    setLocale(value as Locale);
    setMessage(t("settings.localeChanged"));
  };

  const logout = () => {
    setConfirmLogout(false);
    clearSession();
    router.replace("/auth/login");
  };

  return (
    <Page title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <SuccessMessage message={message} />

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
          <p className="text-body-medium text-on-surface-variant">{t("settings.accountBody")}</p>
          <Button variant="danger" className="mt-4" onClick={() => setConfirmLogout(true)}>
            {t("common.logout")}
          </Button>
        </div>
      </Card>

      <Card variant="outlined" className="space-y-4">
        <div>
          <h2 className="text-title-large text-on-surface">{t("nav.profile")}</h2>
          <p className="text-body-medium text-on-surface-variant">{t("settings.accountBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push("/profile/edit")}>
              {t("profile.editTitle")}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/profile/avatar")}>
              {t("profile.editAvatar")}
            </Button>
          </div>
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
      </Card>

      <ConfirmDialog
        open={confirmLogout}
        title={t("settings.logoutConfirmTitle")}
        description={t("settings.logoutConfirmBody")}
        confirmLabel={t("common.logout")}
        cancelLabel={t("common.cancel")}
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
    </Page>
  );
}
