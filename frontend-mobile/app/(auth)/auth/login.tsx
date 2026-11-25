import * as AuthSession from "expo-auth-session";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Check } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import {
  Button,
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
  GOOGLE_REDIRECT_URI,
  GOOGLE_WEB_CLIENT_ID,
  signInWithGoogle,
} from "../../../lib/auth";
import {
  errorDescriptorText,
  nativeGoogleErrorDescriptor,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "../../../lib/errors";
import { requestGoogleIdToken } from "../../../lib/google-signin";
import { refreshSession } from "../../../lib/api";
import {
  applyTokenResponse,
  getPendingInviteCode,
  getSession,
  sessionNeedsRefresh,
  type SessionState,
} from "../../../lib/session";
import { spacing } from "../../../lib/generated/tokens";
import { typeStyle } from "../../../lib/ui-styles";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [loading, setLoading] = useState(false);
  const isOAuthPopup =
    Platform.OS === "web" && typeof window !== "undefined" && Boolean(window.opener);

  const redirectFromSession = useCallback(
    async (session: SessionState) => {
      if (session.needs_profile_setup) {
        router.replace("/profile/setup");
        return;
      }
      if (session.needs_family_setup) {
        const pendingInvite = await getPendingInviteCode();
        router.replace(pendingInvite ? "/invite" : "/family/select");
        return;
      }
      router.replace("/");
    },
    [router],
  );

  const exchangeIdToken = useCallback(
    async (idToken: string) => {
      setLoading(true);
      setError(null);

    try {
      const data = await signInWithGoogle(idToken);
      const session = await applyTokenResponse(data);
      await redirectFromSession(session);
    } catch (err) {
      setError(toErrorDescriptor(err));
    } finally {
      setLoading(false);
    }
    },
    [redirectFromSession],
  );

  const redirectUri =
    Platform.OS === "web" && GOOGLE_REDIRECT_URI
      ? GOOGLE_REDIRECT_URI
      : AuthSession.makeRedirectUri({
          scheme: "finanzasfamiliares",
          path: "auth/login",
        });

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    redirectUri,
  });

  const handleGooglePress = useCallback(async () => {
    if (Platform.OS === "web") {
      await promptAsync();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestGoogleIdToken();
      if (result.status === "cancelled") {
        setLoading(false);
        return;
      }
      if (result.status === "error") {
        setError(nativeGoogleErrorDescriptor(result.code));
        setLoading(false);
        return;
      }
      await exchangeIdToken(result.idToken);
    } catch (err) {
      setError(toErrorDescriptor(err));
      setLoading(false);
    }
  }, [exchangeIdToken, promptAsync]);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (!session?.access_token) return;
      if (sessionNeedsRefresh(session)) {
        const refreshed = await refreshSession();
        if (refreshed) await redirectFromSession(refreshed);
        return;
      }
      await redirectFromSession(session);
    };
    void checkSession();
  }, [redirectFromSession]);

  useEffect(() => {
    if (isOAuthPopup || !response) return;

    if (response.type === "error") {
      setError({ status: 0, key: "auth.googleFailed", fallback: "", source: "api" });
      return;
    }

    if (response.type !== "success") return;

    const idToken = response.params.id_token || response.authentication?.idToken;
    if (!idToken) {
      setError({ status: 0, key: "auth.invalidGoogleToken", fallback: "", source: "api" });
      return;
    }

    void exchangeIdToken(idToken);
  }, [isOAuthPopup, response, exchangeIdToken]);

  if (isOAuthPopup) {
    return (
      <Page title={t("auth.title")}>
        <Loading message={t("common.validating")} />
      </Page>
    );
  }

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
        <View style={{ gap: spacing[2] }}>
          {["welcome.pointFamily", "welcome.pointRoles", "welcome.pointFinance"].map((key) => (
            <View
              key={key}
              style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing[2] }}
            >
              <Check size={20} color={colors.primary} aria-hidden />
              <Text style={[typeStyle("bodyMedium"), { color: colors.onSurface, flex: 1 }]}>
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
        <ErrorMessage
          message={error ? errorDescriptorText(error, t, t("auth.signInFailed")) : null}
        />
        {loading ? <Loading message={t("common.validating")} /> : null}
        <GoogleSignInButton
          onPress={() => void handleGooglePress()}
          disabled={loading || (Platform.OS === "web" && !request)}
          loading={loading}
        />
        <Text
          style={[
            typeStyle("bodySmall"),
            { color: colors.onSurfaceVariant, textAlign: "center" },
          ]}
        >
          {t("welcome.trust")}
        </Text>
        <Button
          title={t("legal.linkLabel")}
          variant="text"
          onPress={() => router.push("/legal")}
        />
      </Card>
    </Page>
  );
}