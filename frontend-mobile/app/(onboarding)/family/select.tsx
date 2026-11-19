import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import { Button, Card, Loading, Page } from "../../../components/ui";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { getPendingInviteCode } from "../../../lib/session";
import { typeStyle } from "../../../lib/ui-styles";

export default function FamilySelectScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [codeChecked, setCodeChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void getPendingInviteCode().then((code) => {
      if (active) {
        setPendingCode(code);
        setCodeChecked(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/");
    }
  }, [ready, session, router]);

  if (!ready || !session || !codeChecked) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  const hasPendingCode = Boolean(pendingCode);

  const createCard = (
    <Card>
      <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
        {t("family.createHeading")}
      </Text>
      <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
        {t("family.createBody")}
      </Text>
      <Button
        title={t("family.createCta")}
        variant={hasPendingCode ? "secondary" : "primary"}
        onPress={() => router.push("/family/create")}
      />
    </Card>
  );

  const joinCard = hasPendingCode ? (
    <Card>
      <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
        {t("family.joinWithCodeTitle")}
      </Text>
      <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
        {t("family.joinWithCodeBody")}
      </Text>
      <Button title={t("family.joinWithCodeCta")} onPress={() => router.push("/invite")} />
    </Card>
  ) : (
    <Card>
      <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
        {t("family.invitedHeading")}
      </Text>
      <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
        {t("family.invitedBody")}
      </Text>
      <Button
        title={t("family.invitedCta")}
        variant="secondary"
        onPress={() => router.push("/invite")}
      />
    </Card>
  );

  return (
    <Page title={t("family.selectTitle")} subtitle={t("family.selectSubtitle")}>
      {hasPendingCode ? joinCard : createCard}
      {hasPendingCode ? createCard : joinCard}
    </Page>
  );
}