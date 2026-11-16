"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Card, ErrorMessage, GoogleSignInButton, Loading, Page } from "@/components/ui";
import { signInWithGoogle } from "@/lib/auth";
import {
  errorDescriptorFromKey,
  errorDescriptorText,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "@/lib/errors";
import { applyTokenResponse, getPendingInviteCode, getSession } from "@/lib/session";

function nextPath(current: { needs_profile_setup: boolean; needs_family_setup: boolean }): string {
  if (current.needs_profile_setup) return "/profile/setup";
  if (current.needs_family_setup) {
    return getPendingInviteCode() ? "/invite" : "/family/select";
  }
  return "/family/members";
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.access_token) return;
    router.replace(nextPath(session));
  }, [router]);

  const handleSuccess = async (credential: string) => {
    if (!credential) {
      setError(errorDescriptorFromKey("auth.invalidGoogleToken"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await signInWithGoogle(credential);
      const session = applyTokenResponse(data);
      router.push(nextPath(session));
    } catch (err) {
      setError(toErrorDescriptor(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title={t("auth.title")} subtitle={t("auth.subtitle")}>
      <Card variant="elevated">
        <div className="space-y-4">
          <ErrorMessage
            message={error ? errorDescriptorText(error, t, t("auth.signInFailed")) : null}
          />
          {loading ? <Loading message={t("common.validating")} /> : null}
          <div className="flex justify-center py-2">
            <GoogleSignInButton
              onSuccess={handleSuccess}
              onError={() => setError(errorDescriptorFromKey("auth.googleFailed"))}
            />
          </div>
        </div>
      </Card>
    </Page>
  );
}
