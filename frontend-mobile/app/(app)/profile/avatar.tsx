import { useRouter } from "expo-router";
import { View } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { AvatarEditor, Card, Loading, Page } from "../../../components/ui";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { spacing } from "../../../lib/generated/tokens";

export default function ProfileAvatarScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  };

  if (!ready || !session) return <Loading />;

  return (
    <Page title={t("avatar.title")} subtitle={t("avatar.subtitle")} onBack={goBack}>
      <Card>
        <View style={{ paddingVertical: spacing[2] }}>
          <AvatarEditor seed={session.user.email || session.user.id} />
        </View>
      </Card>
    </Page>
  );
}
