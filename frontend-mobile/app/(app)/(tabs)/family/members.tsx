import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";

import {
  Avatar,
  Button,
  Card,
  Dialog,
  ErrorMessage,
  Loading,
  Page,
  SuccessMessage,
} from "../../../../components/ui";
import { useI18n } from "../../../../components/providers/LocaleProvider";
import { useTheme } from "../../../../components/providers/ThemeProvider";
import { api, ApiError, refreshSession } from "../../../../lib/api";
import { errorText } from "../../../../lib/errors";
import { clearSession } from "../../../../lib/session";
import type { FamilyDetail, Invitation } from "../../../../lib/types";
import { useAuthGuard } from "../../../../hooks/useAuthGuard";
import { spacing, shape } from "../../../../lib/generated/tokens";
import { typeStyle } from "../../../../lib/ui-styles";

export default function FamilyMembersScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const handleError = useCallback(
    async (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        await clearSession();
        router.replace("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        const reconciled = await refreshSession();
        if (!reconciled) {
          await clearSession();
          router.replace("/auth/login");
          return;
        }
        if (reconciled.needs_family_setup) {
          router.replace("/family/select");
          return;
        }
        setError(errorText(err, t, t("family.loadFailed")));
        return;
      }
      setError(errorText(err, t, t("family.loadFailed")));
    },
    [router, t],
  );

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFamily();
      setFamily(data);
    } catch (err) {
      await handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (ready && session) {
      void loadFamily();
    }
  }, [ready, session, loadFamily]);

  const generateInvitation = async () => {
    setError(null);
    setMessage(null);
    try {
      const data = await api.createInvitation();
      setInvitation(data);
      setMessage(t("family.invitationGenerated"));
    } catch (err) {
      await handleError(err);
    }
  };

  const shareInvitation = async () => {
    if (!invitation) return;
    await Share.share({
      message: t("family.inviteShareMessage", { link: invitation.link }),
    });
  };

  const promote = async (userId: string) => {
    setError(null);
    setMessage(null);
    try {
      await api.promoteMember(userId);
      setMessage(t("family.promoteSuccess"));
      await loadFamily();
    } catch (err) {
      await handleError(err);
    }
  };

  const remove = async (userId: string) => {
    setPendingRemoval(null);
    setError(null);
    setMessage(null);
    try {
      await api.removeMember(userId);
      setMessage(t("family.removeSuccess"));
      await loadFamily();
    } catch (err) {
      await handleError(err);
    }
  };

  if (!ready || !session) return <Loading />;

  const currentMember = family?.members.find((member) => member.user_id === session.user.id);
  const isAdmin = currentMember?.role === "admin";
  const roleLabel = (role: string) =>
    role === "admin" ? t("family.adminRole") : t("family.memberRole");

  return (
    <Page
      title={family?.family.nombre ?? t("family.membersTitleFallback")}
      subtitle={
        family
          ? t("family.membersSubtitle", {
              currency: family.family.moneda_local,
              count: family.member_count,
            })
          : t("family.membersLoading")
      }
    >
      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      {loading ? <Loading /> : null}

      {family ? (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("family.membersHeading")}
          </Text>
          {family.members.map((member) => (
            <View
              key={member.user_id}
              style={[styles.member, { borderBottomColor: colors.outlineVariant }]}
            >
              <View style={styles.memberIdentity}>
                <Avatar
                  name={member.nombre_visualizacion}
                  seed={member.user_id}
                  src={member.foto_avatar}
                  size="md"
                />
                <View style={styles.memberCopy}>
                  <Text style={[typeStyle("bodyLarge"), { color: colors.onSurface }]}>
                    {member.nombre_visualizacion || t("common.noName")}
                  </Text>
                  <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
                    {roleLabel(member.role)}
                    {member.parentesco ? ` · ${member.parentesco}` : ""}
                    {member.user_id === session.user.id ? ` · ${t("common.you")}` : ""}
                  </Text>
                </View>
              </View>

              {isAdmin && member.user_id !== session.user.id ? (
                <View style={styles.memberActions}>
                  {member.role !== "admin" ? (
                    <Button
                      title={t("family.promote")}
                      variant="tonal"
                      onPress={() => void promote(member.user_id)}
                    />
                  ) : null}
                  <Button
                    title={t("family.remove")}
                    variant="danger"
                    onPress={() => setPendingRemoval(member.user_id)}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("family.inviteHeading")}
          </Text>
          <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
            {t("family.inviteBody")}
          </Text>
          <Button title={t("family.generateInvitation")} onPress={() => void generateInvitation()} />
          {invitation ? (
            <View style={[styles.invitation, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text selectable style={[typeStyle("bodyMedium"), { color: colors.onSurface }]}>
                {invitation.link}
              </Text>
              <Button
                title={t("common.shareLink")}
                variant="secondary"
                onPress={() => void shareInvitation()}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Dialog
        open={pendingRemoval !== null}
        title={t("family.removeConfirmTitle")}
        onClose={() => setPendingRemoval(null)}
        closeLabel={t("common.cancel")}
      >
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("family.removeConfirmBody")}
        </Text>
        <Button
          title={t("family.removeConfirm")}
          variant="danger"
          onPress={() => {
            if (pendingRemoval) void remove(pendingRemoval);
          }}
        />
      </Dialog>
    </Page>
  );
}

const styles = StyleSheet.create({
  member: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
    minWidth: 180,
  },
  memberCopy: {
    flex: 1,
    gap: spacing[1],
  },
  memberActions: {
    gap: spacing[2],
  },
  invitation: {
    borderRadius: shape.sm,
    padding: spacing[3],
    gap: spacing[2],
  },
});
