"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { FamilyActions } from "@/components/family/FamilyActions";
import { InviteCode } from "@/components/family/InviteCode";
import { useI18n } from "@/components/providers/LocaleProvider";
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorMessage,
  Loading,
  Page,
  SuccessMessage,
} from "@/components/ui";
import { api, ApiError, refreshSession } from "@/lib/api";
import { errorText } from "@/lib/errors";
import {
  invitationCode,
  invitationDaysRemaining,
  invitationStatus,
} from "@/lib/invitation";
import { applyFamilyLeft, clearSession } from "@/lib/session";
import type { FamilyDetail, Invitation, Member } from "@/lib/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function FamilyMembersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<"delete" | "leave" | null>(null);

  const handleError = useCallback(
    async (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        router.replace("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        const reconciled = await refreshSession();
        if (!reconciled) {
          clearSession();
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
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api.createInvitation();
      setInvitation(data);
      setMessage(t("family.invitationGenerated"));
    } catch (err) {
      await handleError(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitationCode(invitation));
      setMessage(t("common.copiedCode"));
    } catch {
      setMessage(t("common.copyCodeFailed"));
    }
  };

  const shareCode = async () => {
    if (!invitation) return;
    const text = t("family.inviteShareMessage", {
      code: invitationCode(invitation),
    });
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text });
      } else {
        await copyCode();
      }
    } catch {
      setMessage(t("common.copyCodeFailed"));
    }
  };

  const leaveFamily = async () => {
    setLoadingAction("leave");
    setActionError(null);
    try {
      const data = await api.leaveFamily();
      applyFamilyLeft(data);
      router.replace("/family/select");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await handleError(err);
      } else {
        setActionError(errorText(err, t, t("family.leaveFamilyFailed")));
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
      applyFamilyLeft(data);
      router.replace("/family/select");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await handleError(err);
      } else {
        setActionError(errorText(err, t, t("family.deleteFamilyFailed")));
      }
    } finally {
      setLoadingAction(null);
    }
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
  const isAdmin = (currentMember?.rol_permiso ?? currentMember?.role) === "admin";
  const roleLabel = (member: Member) => {
    const role = member.rol_permiso ?? member.role;
    return role === "admin" ? t("family.adminRole") : t("family.memberRole");
  };
  const familyRoleLabel = (member: Member) =>
    member.rol_familiar ?? member.parentesco ?? t("family.memberRole");

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
        <Card variant="outlined" className="space-y-2">
          <div className="space-y-1">
            <h2 className="text-title-large text-on-surface">{t("family.membersHeading")}</h2>
            <p className="text-body-small text-on-surface-variant">{t("family.memberLimit")}</p>
          </div>
          {family.members.length === 0 ? (
            <EmptyState
              title={t("family.membersHeading")}
              description={t("family.membersEmpty")}
            />
          ) : (
            <ul className="divide-y divide-outline-variant">
              {family.members.map((member) => (
                <li
                  key={member.user_id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={member.nombre_visualizacion}
                      seed={member.user_id}
                      src={member.foto_avatar}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-body-large font-semibold text-on-surface">
                        {member.nombre_visualizacion || t("common.noName")}
                      </p>
                      <p className="text-body-small text-on-surface-variant">
                        {t("family.roleFamilyLabel")}: {familyRoleLabel(member)} ·{" "}
                        {t("family.rolePermissionLabel")}: {roleLabel(member)}
                        {member.user_id === session.user.id ? ` · ${t("common.you")}` : ""}
                      </p>
                      <p className="text-body-small text-on-surface-variant">
                        {member.estado === "activo"
                          ? t("family.memberStatusActive")
                          : member.estado}
                      </p>
                    </div>
                  </div>

                  {isAdmin && member.user_id !== session.user.id ? (
                    <div className="flex flex-wrap gap-2">
                      {(member.rol_permiso ?? member.role) !== "admin" ? (
                        <Button
                          size="sm"
                          variant="tonal"
                          onClick={() => void promote(member.user_id)}
                        >
                          {t("family.promote")}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setPendingRemoval(member.user_id)}
                      >
                        {t("family.remove")}
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {isAdmin ? (
        <Card variant="elevated" className="space-y-4">
          <h2 className="text-title-large text-on-surface">{t("family.inviteHeading")}</h2>
          <p className="text-body-medium text-on-surface-variant">{t("family.inviteBody")}</p>
          <Button loading={generating} onClick={() => void generateInvitation()}>
            {t("family.generateInvitation")}
          </Button>

          {invitation ? (
            <InviteCode
              code={invitationCode(invitation)}
              expiresAt={invitation.expira_en}
              daysRemaining={invitationDaysRemaining(invitation.expira_en)}
              status={invitationStatus(invitation)}
              loading={generating}
              onCopy={copyCode}
              onShare={shareCode}
            />
          ) : (
            <p className="text-body-medium text-on-surface-variant">
              {t("family.invitationEmpty")}
            </p>
          )}
        </Card>
      ) : null}

      {family ? (
        <Card variant="outlined" className="space-y-3">
          <h2 className="text-title-large text-on-surface">{t("family.familyActionsHeading")}</h2>
          <FamilyActions
            memberCount={family.member_count}
            loadingAction={loadingAction}
            error={actionError}
            onDelete={deleteFamily}
            onLeave={leaveFamily}
          />
        </Card>
      ) : null}

      <ConfirmDialog
        open={pendingRemoval !== null}
        title={t("family.removeConfirmTitle")}
        description={t("family.removeConfirmBody")}
        confirmLabel={t("family.removeConfirm")}
        cancelLabel={t("common.cancel")}
        destructive
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) void remove(pendingRemoval);
        }}
      />
    </Page>
  );
}
