"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, ErrorMessage, Page } from "@/components/ui";
import { signInWithGoogle } from "@/lib/auth";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.access_token) return;

    router.replace(nextPath(session));
  }, [router]);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError("Google no devolvió un token válido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await signInWithGoogle(credentialResponse.credential);
      const session = applyTokenResponse(data);

      router.push(nextPath(session));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Finanzas Familiares"
      subtitle="Inicia sesión con tu cuenta de Google para administrar el presupuesto familiar."
    >
      <Card>
        <ErrorMessage message={error} />
        {loading ? <p>Validando tu cuenta...</p> : null}
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError("El inicio de sesión con Google falló.")}
            useOneTap={false}
          />
        </div>
      </Card>
    </Page>
  );
}
