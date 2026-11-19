import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "../../../components/ui";
import { ApiError, api } from "../../../lib/api";
import {
  errorDescriptorText,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "../../../lib/errors";
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
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [codeError, setCodeError] = useState<ErrorDescriptor | null>(null);
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
      router.replace("/");
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
      });
      await applyInvitationJoined(data);
      await clearPendingInviteCode();
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        await clearPendingInviteCode();
      }
      const descriptor = toErrorDescriptor(err);
      if (
        err instanceof ApiError &&
        (err.messageKey?.includes("invitation") || err.status === 400)
      ) {
        setCodeError(descriptor);
      } else {
        setError(descriptor);
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
        <ErrorMessage
          message={error ? errorDescriptorText(error, t, t("invite.joinFailed")) : null}
        />
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
          error={
            codeError
              ? errorDescriptorText(codeError, t, t("invite.joinFailed"))
              : undefined
          }
          hint={t("invite.codeNotice")}
          autoCapitalize="characters"
          autoCorrect={false}
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