import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import { Avatar, Button, Card, Loading, Page } from "../../../components/ui";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { spacing } from "../../../lib/generated/tokens";
import { typeStyle } from "../../../lib/ui-styles";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard(true);

  if (!ready || !session) return <Loading />;

  const user = session.user;
  const roleLabel = user.role === "admin" ? t("family.adminRole") : t("family.memberRole");

  return (
    <Page title={t("nav.profile")} subtitle={user.email}>
      <Card>
        <View style={styles.identity}>
          <Avatar
            name={user.nombre_visualizacion}
            seed={user.email || user.id}
            src={user.foto_avatar}
            size="xl"
          />
          <View style={styles.copy}>
            <Text style={[typeStyle("headlineSmall"), { color: colors.onSurface }]}>
              {user.nombre_visualizacion || t("common.noName")}
            </Text>
            <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
              {user.email}
            </Text>
            {user.family_id ? (
              <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
                {roleLabel}
              </Text>
            ) : null}
          </View>
        </View>
        <Button
          title={t("profile.editTitle")}
          onPress={() => router.push("/profile/edit")}
        />
        <Button
          title={t("nav.settings")}
          variant="secondary"
          onPress={() => router.push("/settings")}
        />
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  copy: {
    alignItems: "center",
    gap: spacing[1],
  },
});
