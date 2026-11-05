import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "../../../components/ui";
import { ApiError, api } from "../../../lib/api";
import { errorText } from "../../../lib/errors";
import {
  applyInvitationJoined,
  clearPendingInviteToken,
  getPendingInviteToken,
  savePendingInviteToken,
} from "../../../lib/session";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

export default function InviteScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const [token, setToken] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const value = Array.isArray(params.token) ? params.token[0] : params.token;
    if (value) {
      setToken(value);
      void savePendingInviteToken(value);
      return;
    }
    getPendingInviteToken().then((pending) => {
      if (pending) setToken(pending);
    });
  }, [params.token]);

  const { session, ready } = useAuthGuard();

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      void clearPendingInviteToken();
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  const handleSubmit = async () => {
    setJoining(true);
    setError(null);

    try {
      const data = await api.joinInvitation({
        token: token.trim(),
        parentesco: parentesco.trim() || undefined,
      });
      await applyInvitationJoined(data);
      await clearPendingInviteToken();
      router.replace("/family/members");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        await clearPendingInviteToken();
        setToken("");
      }
      setError(errorText(err, t, t("invite.joinFailed")));
    } finally {
      setJoining(false);
    }
  };

  const discardInvitation = async () => {
    await clearPendingInviteToken();
    router.replace("/family/select");
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  return (
    <Page title={t("invite.title")} subtitle={t("invite.subtitle")}>
      <Card>
        <ErrorMessage message={error} />
        <Field
          label={t("invite.tokenLabel")}
          value={token}
          onChangeText={setToken}
          placeholder={t("invite.tokenPlaceholder")}
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
          disabled={joining || !token.trim()}
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