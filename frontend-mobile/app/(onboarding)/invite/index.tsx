import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "../../../components/ui";
import { ApiError, api } from "../../../lib/api";
import { errorText } from "../../../lib/errors";
import { normalizeInvitationCode } from "../../../lib/invitation";
import {
  applyInvitationJoined,
  clearPendingInviteCode,
  getPendingInviteCode,
  savePendingInviteCode,
} from "../../../lib/session";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

export default function InviteScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    void getPendingInviteCode().then((pending) => {
      if (pending) setCode(pending);
    });
  }, []);

  const { session, ready } = useAuthGuard();

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      void clearPendingInviteCode();
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  const handleSubmit = async () => {
    const normalized = normalizeInvitationCode(code);
    if (!normalized) return;

    setJoining(true);
    setError(null);
    setCodeError(null);

    try {
      const data = await api.joinFamilyByCode({
        codigo: normalized,
        parentesco: parentesco.trim() || undefined,
      });
      await applyInvitationJoined(data);
      await clearPendingInviteCode();
      router.replace("/family/members");
    } catch (err) {
      const message = errorText(err, t, t("invite.joinFailed"));
      if (err instanceof ApiError && err.status === 400) {
        await clearPendingInviteCode();
      }
      if (
        err instanceof ApiError &&
        (err.messageKey?.includes("invitation") || err.status === 400)
      ) {
        setCodeError(message);
      } else {
        setError(message);
      }
    } finally {
      setJoining(false);
    }
  };

  const discardInvitation = async () => {
    await clearPendingInviteCode();
    router.replace("/family/select");
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  return (
    <Page title={t("invite.title")} subtitle={t("invite.subtitle")}>
      <Card>
        <ErrorMessage message={error} />
        <Field
          label={t("invite.codeLabel")}
          value={code}
          onChangeText={(value) => {
            const next = value.toUpperCase();
            setCode(next);
            setCodeError(null);
            void savePendingInviteCode(normalizeInvitationCode(next));
          }}
          placeholder={t("invite.codePlaceholder")}
          error={codeError ?? undefined}
          hint={t("invite.codeNotice")}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Field
          label={t("invite.relationshipLabel")}
          value={parentesco}
          onChangeText={setParentesco}
          placeholder={t("invite.relationshipPlaceholder")}
          maxLength={80}
        />
        <Button
          title={joining ? t("invite.joining") : t("invite.join")}
          onPress={handleSubmit}
          loading={joining}
          disabled={joining || !normalizeInvitationCode(code)}
        />
        <Button
          title={t("invite.backToSelect")}
          variant="secondary"
          onPress={discardInvitation}
        />
      </Card>
    </Page>
  );
}