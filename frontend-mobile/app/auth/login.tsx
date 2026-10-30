import * as AuthSession from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";

import { Button, Card, ErrorMessage, Loading, Page } from "../../components/ui";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  signInWithGoogle,
} from "../../lib/auth";
import { applyTokenResponse, getSession, type SessionState } from "../../lib/session";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectFromSession = useCallback(
    (session: SessionState) => {
      if (session.needs_profile_setup) router.replace("/profile/setup");
      else if (session.needs_family_setup) router.replace("/family/select");
      else router.replace("/family/members");
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
      if (session?.access_token) redirectFromSession(session);
    };
    checkSession();
  }, [redirectFromSession]);

  useEffect(() => {
    if (!response) return;

    if (response.type === "error") {
      setError("El inicio de sesión con Google falló.");
      return;
    }

    if (response.type !== "success") return;

    const idToken = response.params.id_token || response.authentication?.idToken;
    if (!idToken) {
      setError("Google no devolvió un token válido.");
      return;
    }

    const exchangeToken = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await signInWithGoogle(idToken);
        const session = await applyTokenResponse(data);
        redirectFromSession(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      } finally {
        setLoading(false);
      }
    };

    exchangeToken();
  }, [response, redirectFromSession]);

  if (!GOOGLE_WEB_CLIENT_ID) {
    return (
      <Page title="Finanzas Familiares">
        <ErrorMessage message="Falta configurar EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID." />
      </Page>
    );
  }

  return (
    <Page
      title="Finanzas Familiares"
      subtitle="Inicia sesión con tu cuenta de Google para administrar el presupuesto familiar."
    >
      <Card>
        <ErrorMessage message={error} />
        {loading ? <Loading message="Validando tu cuenta..." /> : null}
        <Button
          title="Continuar con Google"
          onPress={() => promptAsync()}
          disabled={!request || loading}
        />
      </Card>
    </Page>
  );
}
