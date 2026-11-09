"use client";

import { useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Badge, Button, ErrorMessage } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { formatInvitationCode, type InvitationStatus } from "@/lib/invitation";

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
    <div className="space-y-3 rounded-sm bg-surface-container-high p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label-large font-semibold text-on-surface">{t("family.invitationCode")}</p>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>

      <p className="select-all text-headline-small font-semibold tracking-widest text-on-surface">
        {formatInvitationCode(code)}
      </p>

      <p id="invite-code-expiry" className="text-body-small text-on-surface-variant">
        {t("family.invitationExpires", {
          date: formatDate(expiresAt, formatLocale),
          days: daysRemaining,
        })}
        {" · "}
        {t("family.invitationSingleUse")}
      </p>

      <ErrorMessage message={error} />
      {copied ? (
        <p role="status" className="text-body-small text-success">
          {t("common.copiedCode")}
        </p>
      ) : null}

      {active ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            aria-describedby="invite-code-expiry"
            onClick={() => void copy()}
          >
            {t("common.copyCode")}
          </Button>
          {onShare ? (
            <Button variant="text" size="sm" onClick={() => void onShare()}>
              {t("common.shareCode")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
