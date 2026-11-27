import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { ArrowUpCircle, Pencil, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";

import { FamilyActions } from "../../../../components/family/FamilyActions";
import { InviteCode } from "../../../../components/family/InviteCode";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorMessage,
  Field,
  IconButton,
  Loading,
  Page,
  Select,
  SuccessMessage,
} from "../../../../components/ui";
import { useI18n } from "../../../../components/providers/LocaleProvider";
import { useTheme } from "../../../../components/providers/ThemeProvider";
import { api, ApiError, refreshSession } from "../../../../lib/api";
import {
  errorDescriptorText,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "../../../../lib/errors";
import {
  invitationCode,
  invitationDaysRemaining,
  invitationStatus,
} from "../../../../lib/invitation";
import { applyFamilyLeft, clearSession } from "../../../../lib/session";
import {
  rehydrateLastInvitation,
  useLastInvitation,
} from "../../../../lib/store/invitation";
import type { FamilyDetail, FamilyRole, Member } from "../../../../lib/types";
import { useAuthGuard } from "../../../../hooks/useAuthGuard";
import { spacing, shape } from "../../../../lib/generated/tokens";
import { typeStyle } from "../../../../lib/ui-styles";

export default function FamilyMembersScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const storedFamilyId = useLastInvitation((state) => state.familyId);
  const storedInvitation = useLastInvitation((state) => state.invitation);
  const setStoredInvitation = useLastInvitation((state) => state.setInvitation);
  const clearStoredInvitation = useLastInvitation((state) => state.clear);
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [membersFeedback, setMembersFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inviteRole, setInviteRole] = useState<FamilyRole>("hijo");
  const [inviteKinship, setInviteKinship] = useState("");
  const [inviteKinshipError, setInviteKinshipError] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [memberAction, setMemberAction] = useState<{
    type: "promote" | "remove";
    userId: string;
  } | null>(null);
  const [actionError, setActionError] = useState<ErrorDescriptor | null>(null);
  const [loadingAction, setLoadingAction] = useState<"delete" | "leave" | null>(null);

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
        setError(toErrorDescriptor(err));
        return;
      }
      setError(toErrorDescriptor(err));
    },
    [router],
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

  useEffect(() => {
    void rehydrateLastInvitation();
  }, []);

  const invitation =
    family && storedFamilyId === family.family.id ? storedInvitation : null;

  useEffect(() => {
    if (!invitation) return;
    if (invitation.usado) {
      clearStoredInvitation();
      return;
    }
    let active = true;
    void api
      .getInvitation(invitation.invitation_id)
      .then((fresh) => {
        if (active && fresh.usado) clearStoredInvitation();
      })
      .catch(() => {
        // Sin conexión no se rompe la pantalla: se conserva el código mostrado.
      });
    return () => {
      active = false;
    };
  }, [family, invitation, clearStoredInvitation]);

  const resolveActionError = useCallback(
    async (err: unknown): Promise<string | null> => {
      if (err instanceof ApiError && err.status === 401) {
        await clearSession();
        router.replace("/auth/login");
        return null;
      }
      if (err instanceof ApiError && err.status === 403) {
        const reconciled = await refreshSession();
        if (!reconciled) {
          await clearSession();
          router.replace("/auth/login");
          return null;
        }
        if (reconciled.needs_family_setup) {
          router.replace("/family/select");
          return null;
        }
      }
      return errorDescriptorText(toErrorDescriptor(err), t, t("family.loadFailed"));
    },
    [router, t],
  );

  const generateInvitation = async () => {
    const isOtherRole = inviteRole === "otro";
    const trimmedKinship = inviteKinship.trim();
    if (isOtherRole && !trimmedKinship) {
      setInviteKinshipError(true);
      return;
    }
    setGenerating(true);
    setInviteFeedback(null);
    try {
      const data = await api.createInvitation({
        rolFamiliar: inviteRole,
        parentesco: isOtherRole ? trimmedKinship : undefined,
      });
      if (family) {
        setStoredInvitation(family.family.id, data);
      }
      setInviteFeedback({ kind: "success", text: t("family.invitationGenerated") });
    } catch (err) {
      const text = await resolveActionError(err);
      if (text) setInviteFeedback({ kind: "error", text });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!invitation) return;
    try {
      await Clipboard.setStringAsync(invitationCode(invitation));
      setInviteFeedback({ kind: "success", text: t("common.copiedCode") });
    } catch {
      setInviteFeedback({ kind: "error", text: t("common.copyCodeFailed") });
    }
  };

  const shareInvitation = async () => {
    if (!invitation) return;
    try {
      await Share.share({
        message: t("family.inviteShareMessage", {
          code: invitationCode(invitation),
        }),
      });
    } catch {
      setInviteFeedback({ kind: "error", text: t("common.copyCodeFailed") });
    }
  };

  const leaveFamily = async () => {
    setLoadingAction("leave");
    setActionError(null);
    try {
      const data = await api.leaveFamily();
      await applyFamilyLeft(data);
      clearStoredInvitation();
      router.replace("/family/select");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await handleError(err);
      } else {
        setActionError(toErrorDescriptor(err));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteFamily = async () => {
    setLoadingAction("delete");
    setActionError(null);
    try {
      const data = await api.deleteFamily();
      await applyFamilyLeft(data);
      clearStoredInvitation();
      router.replace("/family/select");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await handleError(err);
      } else {
        setActionError(toErrorDescriptor(err));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const promote = async (userId: string) => {
    setMemberAction({ type: "promote", userId });
    setMembersFeedback(null);
    try {
      await api.promoteMember(userId);
      setMembersFeedback({ kind: "success", text: t("family.promoteSuccess") });
      await loadFamily();
    } catch (err) {
      const text = await resolveActionError(err);
      if (text) setMembersFeedback({ kind: "error", text });
    } finally {
      setMemberAction(null);
    }
  };

  const remove = async (userId: string) => {
    setMemberAction({ type: "remove", userId });
    setMembersFeedback(null);
    try {
      await api.removeMember(userId);
      setMembersFeedback({ kind: "success", text: t("family.removeSuccess") });
      await loadFamily();
    } catch (err) {
      const text = await resolveActionError(err);
      if (text) setMembersFeedback({ kind: "error", text });
    } finally {
      setMemberAction(null);
      setPendingRemoval(null);
    }
  };

  if (!ready || !session) return <Loading />;

  const currentMember = family?.members.find((member) => member.user_id === session.user.id);
  const isAdmin = (currentMember?.rol_permiso ?? currentMember?.role) === "admin";
  const familyRoleLabels: Record<string, string> = {
    padre: t("family.familyRolePadre"),
    madre: t("family.familyRoleMadre"),
    hijo: t("family.familyRoleHijo"),
    hija: t("family.familyRoleHija"),
    tio: t("family.familyRoleTio"),
    abuelo: t("family.familyRoleAbuelo"),
    otro: t("family.familyRoleOtro"),
  };
  const familyRoleLabel = (member: Member) =>
    (member.rol_familiar && familyRoleLabels[member.rol_familiar]) || t("family.memberRole");
  const memberRelation = (member: Member) => {
    const isAdminMember = (member.rol_permiso ?? member.role) === "admin";
    const parts: string[] = [];
    if (member.rol_familiar) parts.push(familyRoleLabel(member));
    if (isAdminMember) parts.push(t("family.adminRole"));
    else if (!member.rol_familiar) parts.push(t("family.memberRole"));
    return parts.join(" · ");
  };
  const roleOptions = (
    ["padre", "madre", "hijo", "hija", "tio", "abuelo", "otro"] as const
  ).map((value) => ({
    value,
    label: familyRoleLabels[value],
  }));
  const invitationRoleLabel = invitation?.rol_familiar
    ? familyRoleLabels[invitation.rol_familiar]
    : undefined;

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
      <ErrorMessage
        message={error ? errorDescriptorText(error, t, t("family.loadFailed")) : null}
        action={<Button title={t("common.retry")} variant="text" onPress={() => void loadFamily()} />}
      />

      {loading ? <Loading /> : null}

      {family ? (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("family.membersHeading")}
          </Text>
          <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
            {t("family.memberLimit")}
          </Text>
          {membersFeedback ? (
            membersFeedback.kind === "success" ? (
              <SuccessMessage message={membersFeedback.text} />
            ) : (
              <ErrorMessage message={membersFeedback.text} />
            )
          ) : null}
          {family.members.length === 0 ? (
            <EmptyState title={t("family.membersHeading")} description={t("family.membersEmpty")} />
          ) : (
            family.members.map((member) => (
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
                      {memberRelation(member)}
                      {member.user_id === session.user.id ? ` · ${t("common.you")}` : ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.memberActions}>
                  {member.user_id === session.user.id ? (
                    <IconButton
                      label={t("family.editMe")}
                      tone="primary"
                      onPress={() => router.push("/profile/edit")}
                    >
                      <Pencil color={colors.primary} size={20} />
                    </IconButton>
                  ) : null}

                  {isAdmin && member.user_id !== session.user.id ? (
                    <>
                      {(member.rol_permiso ?? member.role) !== "admin" ? (
                        <IconButton
                          label={t("family.promote")}
                          tone="primary"
                          loading={
                            memberAction?.type === "promote" &&
                            memberAction.userId === member.user_id
                          }
                          disabled={Boolean(memberAction)}
                          onPress={() => void promote(member.user_id)}
                        >
                          <ArrowUpCircle color={colors.primary} size={20} />
                        </IconButton>
                      ) : null}
                      <IconButton
                        label={t("family.remove")}
                        tone="danger"
                        loading={
                          memberAction?.type === "remove" &&
                          memberAction.userId === member.user_id
                        }
                        disabled={Boolean(memberAction)}
                        onPress={() => setPendingRemoval(member.user_id)}
                      >
                        <X color={colors.error} size={20} />
                      </IconButton>
                    </>
                  ) : null}
                </View>
              </View>
            ))
          )}
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
          <Select
            label={t("family.inviteRoleLabel")}
            value={inviteRole}
            options={roleOptions}
            onChange={(value) => {
              setInviteRole(value as FamilyRole);
              if (value !== "otro") {
                setInviteKinship("");
                setInviteKinshipError(false);
              }
            }}
          />
          <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
            {t("family.inviteRoleHint")}
          </Text>
          {inviteRole === "otro" ? (
            <Field
              label={t("family.inviteKinshipLabel")}
              hint={t("family.inviteKinshipHint")}
              value={inviteKinship}
              maxLength={80}
              aria-required
              error={inviteKinshipError ? t("family.inviteKinshipRequired") : undefined}
              onChangeText={(value) => {
                setInviteKinship(value);
                if (inviteKinshipError && value.trim()) {
                  setInviteKinshipError(false);
                }
              }}
            />
          ) : null}
          <Button
            title={t("family.generateInvitation")}
            loading={generating}
            onPress={() => void generateInvitation()}
          />
          {inviteFeedback ? (
            inviteFeedback.kind === "success" ? (
              <SuccessMessage message={inviteFeedback.text} />
            ) : (
              <ErrorMessage message={inviteFeedback.text} />
            )
          ) : null}
          {invitation ? (
            <InviteCode
              code={invitationCode(invitation)}
              roleLabel={invitationRoleLabel}
              expiresAt={invitation.expira_en}
              daysRemaining={invitationDaysRemaining(invitation.expira_en)}
              status={invitationStatus(invitation)}
              loading={generating}
              onCopy={copyCode}
              onShare={shareInvitation}
            />
          ) : (
            <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
              {t("family.invitationEmpty")}
            </Text>
          )}
        </Card>
      ) : (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("family.inviteHeading")}
          </Text>
          <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
            {t("family.inviteAdminOnly")}
          </Text>
        </Card>
      )}

      {family ? (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("family.familyActionsHeading")}
          </Text>
          <FamilyActions
            memberCount={family.member_count}
            familyName={family.family.nombre}
            loadingAction={loadingAction}
            error={actionError}
            onDelete={deleteFamily}
            onLeave={leaveFamily}
          />
        </Card>
      ) : null}

      <Dialog
        open={pendingRemoval !== null}
        title={t("family.removeConfirmTitle")}
        onClose={() => {
          if (!memberAction) setPendingRemoval(null);
        }}
        closeLabel={t("common.cancel")}
      >
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("family.removeConfirmBody", {
            name:
              family?.members.find((member) => member.user_id === pendingRemoval)
                ?.nombre_visualizacion || t("common.noName"),
          })}
        </Text>
        <Button
          title={t("family.removeConfirm")}
          variant="danger"
          loading={memberAction?.type === "remove" && memberAction.userId === pendingRemoval}
          disabled={Boolean(memberAction)}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  invitation: {
    borderRadius: shape.sm,
    padding: spacing[3],
    gap: spacing[2],
  },
});
