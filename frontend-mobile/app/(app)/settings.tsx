import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

import { useI18n } from "../../components/providers/LocaleProvider";
import { useTheme } from "../../components/providers/ThemeProvider";
import { Button, Card, ChoiceGroup, Dialog, Page } from "../../components/ui";
import { clearSession } from "../../lib/session";
import type { Locale } from "../../lib/i18n/messages.generated";
import type { ThemePreference } from "../../lib/preferences";
import { typeStyle } from "../../lib/ui-styles";
import packageInfo from "../../package.json";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const theme = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  };

  const logout = async () => {
    setConfirmLogout(false);
    await clearSession();
    router.replace("/auth/login");
  };

  return (
    <Page title={t("settings.title")} subtitle={t("settings.subtitle")} onBack={goBack}>
      <Card>
        <Text style={[typeStyle("titleLarge"), { color: theme.colors.onSurface }]}>
          {t("settings.appearanceHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.appearanceBody")}
        </Text>
        <ChoiceGroup
          legend={t("common.appearance")}
          value={theme.mode}
          onChange={(value) => theme.setMode(value as ThemePreference)}
          options={[
            { value: "system", label: t("common.system") },
            { value: "light", label: t("common.light") },
            { value: "dark", label: t("common.dark") },
          ]}
        />
      </Card>

      <Card>
        <Text style={[typeStyle("titleLarge"), { color: theme.colors.onSurface }]}>
          {t("settings.languageHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.languageBody")}
        </Text>
        <ChoiceGroup
          legend={t("common.language")}
          value={locale}
          onChange={(value) => setLocale(value as Locale)}
          options={[
            { value: "es", label: t("common.spanish") },
            { value: "en", label: t("common.english") },
          ]}
        />
      </Card>

      <Card>
        <Text style={[typeStyle("titleLarge"), { color: theme.colors.onSurface }]}>
          {t("settings.accountHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.accountBody")}
        </Text>
        <Button title={t("common.logout")} variant="danger" onPress={() => setConfirmLogout(true)} />
      </Card>

      <Card>
        <Text style={[typeStyle("titleLarge"), { color: theme.colors.onSurface }]}>
          {t("nav.profile")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.legalBody")}
        </Text>
        <Button
          title={t("profile.editTitle")}
          variant="secondary"
          onPress={() => router.push("/profile/edit")}
        />
        <Button
          title={t("profile.editAvatar")}
          variant="secondary"
          onPress={() => router.push("/profile/avatar")}
        />
      </Card>

      <Card>
        <Text style={[typeStyle("titleLarge"), { color: theme.colors.onSurface }]}>
          {t("settings.aboutHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.aboutBody")}
        </Text>
        <Text style={[typeStyle("labelMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.version", { version: packageInfo.version })}
        </Text>
      </Card>

      <Dialog
        open={confirmLogout}
        title={t("settings.logoutConfirmTitle")}
        onClose={() => setConfirmLogout(false)}
        closeLabel={t("common.cancel")}
      >
        <Text style={[typeStyle("bodyMedium"), { color: theme.colors.onSurfaceVariant }]}>
          {t("settings.logoutConfirmBody")}
        </Text>
        <Button title={t("common.logout")} variant="danger" onPress={() => void logout()} />
      </Dialog>
    </Page>
  );
}
