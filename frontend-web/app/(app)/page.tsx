"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Badge, Button, Card, ErrorMessage, Loading, Page } from "@/components/ui";
import { api, ApiError, refreshSession } from "@/lib/api";
import { errorDescriptorText, toErrorDescriptor, type ErrorDescriptor } from "@/lib/errors";
import { clearSession } from "@/lib/session";
import type { FamilyDetail } from "@/lib/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";

interface ChecklistStep {
  id: "profile" | "family" | "invite";
  label: string;
  done: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [loading, setLoading] = useState(true);

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

  const memberCount = family ? family.member_count || family.members.length : 0;
  const currentMember = family?.members.find((member) => member.user_id === session?.user.id);
  const isAdmin = (currentMember?.rol_permiso ?? currentMember?.role) === "admin";
  const firstName = session?.user.nombre_visualizacion?.trim().split(/\s+/)[0];

  const steps = useMemo<ChecklistStep[]>(() => {
    if (!family) return [];
    const hasInvited = memberCount > 1;
    return [
      { id: "profile", label: t("dashboard.checkProfile"), done: Boolean(firstName) },
      { id: "family", label: t("dashboard.checkFamily"), done: true },
      {
        id: "invite",
        label: hasInvited
          ? t("dashboard.checkInviteDone", { count: memberCount })
          : t("dashboard.checkInvite"),
        done: hasInvited,
      },
    ];
  }, [family, memberCount, firstName, t]);

  const completedSteps = steps.filter((step) => step.done).length;
  const invitePending = family ? memberCount <= 1 : false;

  if (!ready || !session) return <Loading />;

  return (
    <Page
      title={t("dashboard.title")}
      subtitle={
        firstName ? t("dashboard.welcome", { name: firstName }) : t("dashboard.subtitle")
      }
    >
      <ErrorMessage
        message={error ? errorDescriptorText(error, t, t("dashboard.loadFailed")) : null}
        action={
          <Button size="sm" variant="text" onClick={() => void loadFamily()}>
            {t("common.retry")}
          </Button>
        }
      />

      {loading && !family ? <Loading message={t("dashboard.loading")} /> : null}

      {family ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-title-large text-on-surface">{t("dashboard.familyHeading")}</h2>
              <p className="mt-1 text-headline-small text-on-surface">{family.family.nombre}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">
                {t("dashboard.membersCount", { count: memberCount })}
              </Badge>
              <Badge>
                {t("dashboard.currencyLabel")}: {family.family.moneda_local}
              </Badge>
            </div>
          </div>
        </Card>
      ) : null}

      {family ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-title-large text-on-surface">{t("dashboard.checklistHeading")}</h2>
            <span className="text-label-large text-on-surface-variant">
              {t("dashboard.checklistProgress", {
                done: completedSteps,
                total: steps.length,
              })}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completedSteps}
            aria-label={t("dashboard.checklistProgress", {
              done: completedSteps,
              total: steps.length,
            })}
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-container-high"
          >
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 space-y-3">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-3">
                <span aria-hidden="true" className="shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-on-surface-variant" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-body-medium text-on-surface">
                  {step.label}
                </span>
                <Badge tone={step.done ? "success" : "neutral"}>
                  {t(step.done ? "dashboard.statusDone" : "dashboard.statusPending")}
                </Badge>
              </li>
            ))}
          </ul>
          {invitePending && isAdmin ? (
            <div className="mt-4">
              <Button onClick={() => router.push("/family/members")}>
                {t("dashboard.inviteCta")}
              </Button>
            </div>
          ) : null}
          {invitePending && !isAdmin ? (
            <p className="mt-4 text-body-small text-on-surface-variant">
              {t("dashboard.inviteAdminHint")}
            </p>
          ) : null}
        </Card>
      ) : null}

      {family ? (
        <Card variant="filled">
          <h2 className="text-title-large text-on-surface">{t("dashboard.financeSoonTitle")}</h2>
          <p className="mt-2 text-body-medium text-on-surface-variant">
            {t("dashboard.financeSoonBody")}
          </p>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="tonal" onClick={() => router.push("/family/members")}>
          {t("dashboard.membersCta")}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/profile/edit")}>
          {t("dashboard.profileCta")}
        </Button>
        <Button variant="text" onClick={() => router.push("/settings")}>
          {t("dashboard.settingsCta")}
        </Button>
      </div>
    </Page>
  );
}
