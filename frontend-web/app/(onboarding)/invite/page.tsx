"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { errorText } from "@/lib/errors";
import {
  applyInvitationJoined,
  clearPendingInviteToken,
  getPendingInviteToken,
  savePendingInviteToken,
} from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

function InviteContent() {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get("token");
    if (queryToken) {
      setToken(queryToken);
      savePendingInviteToken(queryToken);
      return;
    }
    const pending = getPendingInviteToken();
    if (pending) setToken(pending);
  }, [searchParams]);

  const { session, ready } = useAuthGuard();

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      clearPendingInviteToken();
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setJoining(true);
    setError(null);

    try {
      const data = await api.joinInvitation({
        token: token.trim(),
        parentesco: parentesco.trim() || undefined,
      });
      applyInvitationJoined(data);
      clearPendingInviteToken();
      router.replace("/family/members");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        clearPendingInviteToken();
        setToken("");
      }
      setError(errorText(err, t, t("invite.joinFailed")));
    } finally {
      setJoining(false);
    }
  };

  const discardInvitation = () => {
    clearPendingInviteToken();
    router.replace("/family/select");
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  return (
    <Page title={t("invite.title")} subtitle={t("invite.subtitle")}>
      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage message={error} />
          <Field
            label={t("invite.tokenLabel")}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={t("invite.tokenPlaceholder")}
            required
          />
          <Field
            label={t("invite.relationshipLabel")}
            value={parentesco}
            onChange={(event) => setParentesco(event.target.value)}
            placeholder={t("invite.relationshipPlaceholder")}
            maxLength={80}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={joining || !token.trim()} loading={joining}>
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

export default function InvitePage() {
  return (
    <Suspense fallback={<Loading />}>
      <InviteContent />
    </Suspense>
  );
}
