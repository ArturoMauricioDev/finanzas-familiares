import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useI18n } from "../providers/LocaleProvider";
import { useTheme } from "../providers/ThemeProvider";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { ErrorMessage } from "../ui/InlineBanner";
import { spacing } from "../../lib/generated/tokens";
import { typeStyle } from "../../lib/ui-styles";

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
  const { colors } = useTheme();
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
    <View style={styles.root}>
      <Button
        title={label}
        variant="danger"
        loading={loadingAction === action}
        onPress={() => setConfirming(action)}
      />
      <ErrorMessage message={error} />
      <Dialog
        open={confirming !== null}
        title={title}
        closeLabel={t("common.cancel")}
        onClose={() => {
          if (!loadingAction) setConfirming(null);
        }}
      >
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {description}
        </Text>
        <Button
          title={label}
          variant="danger"
          loading={Boolean(loadingAction)}
          onPress={() => {
            if (action === "delete") void onDelete?.();
            if (action === "leave") void onLeave?.();
          }}
        />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[3],
  },
});
