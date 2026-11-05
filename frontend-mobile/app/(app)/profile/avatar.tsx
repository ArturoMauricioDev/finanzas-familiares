import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import { AvatarEditor, Button, Card, Dialog, Loading, Page } from "../../../components/ui";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { spacing } from "../../../lib/generated/tokens";
import { typeStyle } from "../../../lib/ui-styles";

export default function ProfileAvatarScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard(true);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  };

  const goBack = () => {
    if (dirty) {
      setConfirmLeave(true);
      return;
    }
    leave();
  };

  if (!ready || !session) return <Loading />;

  return (
    <Page title={t("avatar.title")} subtitle={t("avatar.subtitle")} onBack={goBack}>
      <Card>
        <View style={{ paddingVertical: spacing[2] }}>
          <AvatarEditor
            seed={session.user.email || session.user.id}
            onDirtyChange={setDirty}
          />
        </View>
      </Card>

      <Dialog
        open={confirmLeave}
        title={t("avatar.discardTitle")}
        onClose={() => setConfirmLeave(false)}
        closeLabel={t("common.cancel")}
      >
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("avatar.discardBody")}
        </Text>
        <Button
          title={t("avatar.discard")}
          variant="danger"
          onPress={() => {
            setConfirmLeave(false);
            leave();
          }}
        />
      </Dialog>
    </Page>
  );
}