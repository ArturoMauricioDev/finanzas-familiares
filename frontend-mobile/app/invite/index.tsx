import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { Button, Card, ErrorMessage, Field, Loading, Page } from "../../components/ui";
import { api } from "../../lib/api";
import { applyInvitationJoined } from "../../lib/session";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function InviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const { session, ready } = useAuthGuard();
  const [token, setToken] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const value = Array.isArray(params.token) ? params.token[0] : params.token;
    if (value) setToken(value);
  }, [params.token]);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  const handleSubmit = async () => {
    setJoining(true);
    setError(null);

    try {
      const data = await api.joinInvitation({
        token: token.trim(),
        parentesco: parentesco.trim() || undefined,
      });
      await applyInvitationJoined(data);
      router.replace("/family/members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo unir al grupo.");
    } finally {
      setJoining(false);
    }
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message="Redirigiendo..." />;

  return (
    <Page
      title="Unirme a un grupo familiar"
      subtitle="Pega el token del enlace de invitación que compartió un administrador."
    >
      <Card>
        <ErrorMessage message={error} />
        <Field
          label="Token de invitación"
          value={token}
          onChangeText={setToken}
          placeholder="Token del enlace"
        />
        <Field
          label="Parentesco (opcional)"
          value={parentesco}
          onChangeText={setParentesco}
          placeholder="Ej. hija, hijo, madre"
          maxLength={80}
        />
        <Button
          title={joining ? "Uniéndome..." : "Unirme al grupo"}
          onPress={handleSubmit}
          disabled={joining || !token.trim()}
        />
      </Card>
    </Page>
  );
}
