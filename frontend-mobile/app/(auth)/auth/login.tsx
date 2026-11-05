import * as AuthSession from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "../../../components/providers/LocaleProvider";
import {
  Card,
  ErrorMessage,
  GoogleSignInButton,
  Loading,
  Page,
  Wordmark,
} from "../../../components/ui";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  signInWithGoogle,
} from "../../../lib/auth";
import { errorText } from "../../../lib/errors";
import {
  applyTokenResponse,
  getPendingInviteToken,
  getSession,
  type SessionState,
} from "../../../lib/session";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectFromSession = useCallback(
    async (session: SessionState) => {
      if (session.needs_profile_setup) {
        router.replace("/profile/setup");
        return;
      }
      if (session.needs_family_setup) {
        const pendingInvite = await getPendingInviteToken();
        router.replace(pendingInvite ? "/invite" : "/family/select");
        return;
      }
      router.replace("/family/members");
    },
    [router],
  );

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "finanzasfamiliares",
    path: "auth/login",
  });

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    redirectUri,
  });

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.access_token) await redirectFromSession(session);
    };
    checkSession();
  }, [redirectFromSession]);

  useEffect(() => {
    if (!response) return;

    if (response.type === "error") {
      setError(t("auth.googleFailed"));
      return;
    }

    if (response.type !== "success") return;

    const idToken = response.params.id_token || response.authentication?.idToken;
    if (!idToken) {
      setError(t("auth.invalidGoogleToken"));
      return;
    }

    const exchangeToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await signInWithGoogle(idToken);
        const session = await applyTokenResponse(data);
        await redirectFromSession(session);
      } catch (err) {
        setError(errorText(err, t, t("auth.signInFailed")));
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [response, redirectFromSession, t]);

  if (!GOOGLE_WEB_CLIENT_ID) {
    return (
      <Page title={t("auth.title")}>
        <ErrorMessage message={t("auth.missingConfigMobile")} />
      </Page>
    );
  }

  return (
    <Page title={t("auth.title")} subtitle={t("auth.subtitle")}>
      <Card>
        <Wordmark size="lg" />
        <ErrorMessage message={error} />
        {loading ? <Loading message={t("common.validating")} /> : null}
        <GoogleSignInButton
          onPress={() => promptAsync()}
          disabled={!request || loading}
          loading={loading}
        />
      </Card>
    </Page>
  );
}