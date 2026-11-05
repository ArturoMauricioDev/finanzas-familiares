"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Card, ErrorMessage, GoogleSignInButton, Loading, Page } from "@/components/ui";
import { signInWithGoogle } from "@/lib/auth";
import { errorText } from "@/lib/errors";
import { applyTokenResponse, getPendingInviteToken, getSession } from "@/lib/session";

function nextPath(current: { needs_profile_setup: boolean; needs_family_setup: boolean }): string {
  if (current.needs_profile_setup) return "/profile/setup";
  if (current.needs_family_setup) {
    return getPendingInviteToken() ? "/invite" : "/family/select";
  }
  return "/family/members";
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.access_token) return;
    router.replace(nextPath(session));
  }, [router]);

  const handleSuccess = async (credential: string) => {
    if (!credential) {
      setError(t("auth.invalidGoogleToken"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await signInWithGoogle(credential);
      const session = applyTokenResponse(data);
      router.push(nextPath(session));
    } catch (err) {
      setError(errorText(err, t, t("auth.signInFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title={t("auth.title")} subtitle={t("auth.subtitle")}>
      <Card variant="elevated">
        <div className="space-y-4">
          <ErrorMessage message={error} />
          {loading ? <Loading message={t("common.validating")} /> : null}
          <div className="flex justify-center py-2">
            <GoogleSignInButton
              onSuccess={handleSuccess}
              onError={() => setError(t("auth.googleFailed"))}
            />
          </div>
        </div>
      </Card>
    </Page>
  );
}
