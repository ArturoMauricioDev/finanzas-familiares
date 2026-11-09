import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { formatDate } from "../../lib/format";
import { formatInvitationCode, type InvitationStatus } from "../../lib/invitation";
import { shape, spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/InlineBanner";

export interface InviteCodeProps {
  code: string;
  expiresAt: string;
  daysRemaining: number;
  status?: InvitationStatus;
  onCopy: () => void | Promise<void>;
  onShare?: () => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function InviteCode({
  code,
  expiresAt,
  daysRemaining,
  status = "active",
  onCopy,
  onShare,
  loading = false,
  error,
}: InviteCodeProps) {
  const { formatLocale, t } = useI18n();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const active = status === "active";
  const statusLabel =
    status === "used"
      ? t("family.invitationStatusUsed")
      : status === "expired"
        ? t("family.invitationStatusExpired")
        : t("family.invitationStatusActive");
  const statusTone = status === "active" ? "success" : status === "used" ? "warning" : "danger";

  const copy = async () => {
    await onCopy();
    setCopied(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surfaceContainerHigh }]}>
      <View style={styles.header}>
        <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>
          {t("family.invitationCode")}
        </Text>
        <Badge label={statusLabel} tone={statusTone} />
      </View>

      <Text
        selectable
        accessibilityLabel={`${t("family.invitationCode")}: ${formatInvitationCode(code)}`}
        style={[typeStyle("headlineSmall"), styles.code, { color: colors.onSurface }]}
      >
        {formatInvitationCode(code)}
      </Text>

      <Text
        accessibilityHint={t("family.invitationSingleUse")}
        style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}
      >
        {t("family.invitationExpires", {
          date: formatDate(expiresAt, formatLocale),
          days: daysRemaining,
        })}
        {" · "}
        {t("family.invitationSingleUse")}
      </Text>

      <ErrorMessage message={error} />
      {copied ? (
        <Text accessibilityLiveRegion="polite" style={[typeStyle("bodySmall"), { color: colors.success }]}>
          {t("common.copiedCode")}
        </Text>
      ) : null}

      {active ? (
        <View style={styles.actions}>
          <Button
            title={t("common.copyCode")}
            variant="secondary"
            loading={loading}
            onPress={() => void copy()}
          />
          {onShare ? (
            <Button title={t("common.shareCode")} variant="text" onPress={() => void onShare()} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: shape.sm,
    padding: spacing[4],
    gap: spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  code: {
    letterSpacing: 2,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
});
