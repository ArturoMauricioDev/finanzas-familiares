import { useRouter } from "expo-router";
import { Text } from "react-native";

import { useI18n } from "../components/providers/LocaleProvider";
import { useTheme } from "../components/providers/ThemeProvider";
import { Card, Page } from "../components/ui";
import { typeStyle } from "../lib/ui-styles";

export default function LegalScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <Page title={t("legal.title")} subtitle={t("legal.body")} onBack={goBack}>
      <Card>
        <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
          {t("legal.privacyHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("legal.privacyBody")}
        </Text>
      </Card>

      <Card>
        <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
          {t("legal.termsHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("legal.termsBody")}
        </Text>
      </Card>
    </Page>
  );
}