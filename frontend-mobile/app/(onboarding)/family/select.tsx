import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import { Button, Card, Loading, Page } from "../../../components/ui";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { typeStyle } from "../../../lib/ui-styles";

export default function FamilySelectScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard();

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  return (
    <Page title={t("family.selectTitle")} subtitle={t("family.selectSubtitle")}>
      <Card>
        <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
          {t("family.createHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("family.createBody")}
        </Text>
        <Button title={t("family.createCta")} onPress={() => router.push("/family/create")} />
      </Card>

      <Card>
        <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
          {t("family.joinHeading")}
        </Text>
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("family.joinBody")}
        </Text>
        <Button
          title={t("family.joinCta")}
          variant="secondary"
          onPress={() => router.push("/invite")}
        />
      </Card>
    </Page>
  );
}