"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Card, ErrorMessage, GoogleSignInButton, Loading, Page } from "@/components/ui";
import { signInWithGoogle } from "@/lib/auth";
import { refreshSession } from "@/lib/api";
import {
  errorDescriptorFromKey,
  errorDescriptorText,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "@/lib/errors";
import {
  applyTokenResponse,
  getPendingInviteCode,
  getSession,
  sessionNeedsRefresh,
} from "@/lib/session";

function nextPath(current: { needs_profile_setup: boolean; needs_family_setup: boolean }): string {
  if (current.needs_profile_setup) return "/profile/setup";
  if (current.needs_family_setup) {
    return getPendingInviteCode() ? "/invite" : "/family/select";
  }
  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const session = getSession();
      if (!session?.access_token) return;
      if (sessionNeedsRefresh(session)) {
        const refreshed = await refreshSession();
        if (active && refreshed) router.replace(nextPath(refreshed));
        return;
      }
      if (active) router.replace(nextPath(session));
    };
    void checkSession();
    return () => {
      active = false;
    };
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
        <div className="space-y-5">
          <ul className="space-y-3">
            {["welcome.pointFamily", "welcome.pointRoles", "welcome.pointFinance"].map((key) => (
              <li key={key} className="flex items-start gap-3">
                <Check size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
                <span className="text-body-large text-on-surface">{t(key)}</span>
              </li>
            ))}
          </ul>
          <ErrorMessage
            message={error ? errorDescriptorText(error, t, t("auth.signInFailed")) : null}
          />
          {loading ? <Loading message={t("common.validating")} /> : null}
          <div className="flex justify-center py-2">
            <GoogleSignInButton
              onSuccess={handleSuccess}
              onError={() => setError(errorDescriptorFromKey("auth.googleFailed"))}
              disabled={loading}
              loading={loading}
            />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-body-small text-on-surface-variant">{t("welcome.trust")}</p>
            <Link
              href="/legal"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-label-large font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("legal.linkLabel")}
            </Link>
          </div>
        </div>
      </Card>
    </Page>
  );
}
