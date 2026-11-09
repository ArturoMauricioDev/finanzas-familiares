"use client";

import { useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Button, ConfirmDialog, ErrorMessage } from "@/components/ui";

export interface FamilyActionsProps {
  memberCount: number;
  onDelete?: () => void | Promise<void>;
  onLeave?: () => void | Promise<void>;
  loadingAction?: "delete" | "leave" | null;
  error?: string | null;
}

export function FamilyActions({
  memberCount,
  onDelete,
  onLeave,
  loadingAction = null,
  error,
}: FamilyActionsProps) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState<"delete" | "leave" | null>(null);
  const canDelete = memberCount === 1;
  const canLeave = memberCount > 1;

  if (!canDelete && !canLeave) return null;

  const action = canDelete ? "delete" : "leave";
  const title = canDelete ? t("family.deleteFamilyConfirmTitle") : t("family.leaveFamilyConfirmTitle");
  const description = canDelete
    ? t("family.deleteFamilyConfirmBody")
    : t("family.leaveFamilyConfirmBody");
  const label = canDelete ? t("family.deleteFamily") : t("family.leaveFamily");

  return (
    <div className="space-y-3">
      <Button
        variant="danger"
        loading={loadingAction === action}
        onClick={() => setConfirming(action)}
      >
        {label}
      </Button>
      <ErrorMessage message={error} />
      <ConfirmDialog
        open={confirming !== null}
        title={title}
        description={description}
        confirmLabel={label}
        cancelLabel={t("common.cancel")}
        destructive
        onCancel={() => {
          if (!loadingAction) setConfirming(null);
        }}
        onConfirm={() => {
          if (action === "delete") void onDelete?.();
          if (action === "leave") void onLeave?.();
        }}
      />
    </div>
  );
}
