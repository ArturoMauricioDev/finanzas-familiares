import { useRouter } from "expo-router";
import { CheckCircle2, Circle } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import { Badge, Button, Card, ErrorMessage, Loading, Page } from "../../../components/ui";
import { api, ApiError, refreshSession } from "../../../lib/api";
import { errorDescriptorText, toErrorDescriptor, type ErrorDescriptor } from "../../../lib/errors";
import { clearSession } from "../../../lib/session";
import type { FamilyDetail } from "../../../lib/types";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { shape, spacing } from "../../../lib/generated/tokens";
import { typeStyle } from "../../../lib/ui-styles";

interface ChecklistStep {
  id: "profile" | "family" | "invite";
  label: string;
  done: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [loading, setLoading] = useState(true);

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
  const progress = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;

  if (!ready || !session) return <Loading />;

  return (
    <Page
      title={t("dashboard.title")}
      subtitle={firstName ? t("dashboard.welcome", { name: firstName }) : t("dashboard.subtitle")}
    >
      <ErrorMessage
        message={error ? errorDescriptorText(error, t, t("dashboard.loadFailed")) : null}
        action={<Button title={t("common.retry")} variant="text" onPress={() => void loadFamily()} />}
      />

      {loading && !family ? <Loading message={t("dashboard.loading")} /> : null}

      {family ? (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("dashboard.familyHeading")}
          </Text>
          <Text style={[typeStyle("headlineSmall"), { color: colors.onSurface }]}>
            {family.family.nombre}
          </Text>
          <View style={styles.badges}>
            <Badge
              label={t("dashboard.membersCount", { count: memberCount })}
              tone="primary"
            />
            <Badge
              label={`${t("dashboard.currencyLabel")}: ${family.family.moneda_local}`}
            />
          </View>
        </Card>
      ) : null}

      {family ? (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
              {t("dashboard.checklistHeading")}
            </Text>
            <Text style={[typeStyle("labelLarge"), { color: colors.onSurfaceVariant }]}>
              {t("dashboard.checklistProgress", {
                done: completedSteps,
                total: steps.length,
              })}
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={t("dashboard.checklistProgress", {
              done: completedSteps,
              total: steps.length,
            })}
            accessibilityValue={{ min: 0, max: steps.length, now: completedSteps }}
            style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progress}%` as `${number}%` },
              ]}
            />
          </View>
          <View style={styles.steps}>
            {steps.map((step) => (
              <View key={step.id} style={styles.step}>
                {step.done ? (
                  <CheckCircle2 color={colors.success} size={20} />
                ) : (
                  <Circle color={colors.onSurfaceVariant} size={20} />
                )}
                <Text style={[typeStyle("bodyMedium"), styles.stepLabel, { color: colors.onSurface }]}>
                  {step.label}
                </Text>
                <Badge
                  label={t(step.done ? "dashboard.statusDone" : "dashboard.statusPending")}
                  tone={step.done ? "success" : "neutral"}
                />
              </View>
            ))}
          </View>
          {invitePending && isAdmin ? (
            <Button
              title={t("dashboard.inviteCta")}
              onPress={() => router.push("/family/members")}
            />
          ) : null}
          {invitePending && !isAdmin ? (
            <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
              {t("dashboard.inviteAdminHint")}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {family ? (
        <Card>
          <Text style={[typeStyle("titleLarge"), { color: colors.onSurface }]}>
            {t("dashboard.financeSoonTitle")}
          </Text>
          <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
            {t("dashboard.financeSoonBody")}
          </Text>
        </Card>
      ) : null}

      <Button
        title={t("dashboard.membersCta")}
        variant="tonal"
        onPress={() => router.push("/family/members")}
      />
      <Button
        title={t("dashboard.profileCta")}
        variant="secondary"
        onPress={() => router.push("/profile/edit")}
      />
      <Button
        title={t("dashboard.settingsCta")}
        variant="text"
        onPress={() => router.push("/settings")}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  rowBetween: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  progressTrack: {
    height: spacing[2],
    borderRadius: shape.full,
    overflow: "hidden",
    marginTop: spacing[2],
  },
  progressFill: {
    height: spacing[2],
    borderRadius: shape.full,
  },
  steps: {
    gap: spacing[3],
    marginTop: spacing[3],
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  stepLabel: {
    flex: 1,
  },
});
