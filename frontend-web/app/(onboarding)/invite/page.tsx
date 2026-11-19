"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import {
  errorDescriptorText,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "@/lib/errors";
import { normalizeInvitationCode } from "@/lib/invitation";
import {
  applyInvitationJoined,
  clearPendingInviteCode,
  getPendingInviteCode,
  savePendingInviteCode,
} from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function InvitePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [codeError, setCodeError] = useState<ErrorDescriptor | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const pending = getPendingInviteCode();
    if (pending) setCode(pending);
  }, []);

  const { session, ready } = useAuthGuard();

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      clearPendingInviteCode();
      router.replace("/");
    }
  }, [ready, session, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeInvitationCode(code);
    if (!normalized) return;

    setJoining(true);
    setError(null);
    setCodeError(null);

    try {
      const data = await api.joinFamilyByCode({
        codigo: normalized,
      });
      applyInvitationJoined(data);
      clearPendingInviteCode();
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        clearPendingInviteCode();
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

  const discardInvitation = () => {
    clearPendingInviteCode();
    router.replace("/family/select");
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  return (
    <Page title={t("invite.title")} subtitle={t("invite.subtitle")}>
      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage
            message={error ? errorDescriptorText(error, t, t("invite.joinFailed")) : null}
          />
          <Field
            label={t("invite.codeLabel")}
            value={code}
            onChange={(event) => {
              const next = event.target.value.toUpperCase();
              setCode(next);
              setCodeError(null);
              savePendingInviteCode(normalizeInvitationCode(next));
            }}
            placeholder={t("invite.codePlaceholder")}
            error={
              codeError
                ? errorDescriptorText(codeError, t, t("invite.joinFailed"))
                : undefined
            }
            hint={t("invite.codeNotice")}
            required
            autoCapitalize="characters"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={joining || !normalizeInvitationCode(code)}
              loading={joining}
            >
              {joining ? t("invite.joining") : t("invite.join")}
            </Button>
            <Button type="button" variant="secondary" onClick={discardInvitation}>
              {t("invite.backToSelect")}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
