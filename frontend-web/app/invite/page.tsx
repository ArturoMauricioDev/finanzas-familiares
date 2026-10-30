"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { api } from "@/lib/api";
import { applyInvitationJoined } from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, ready } = useAuthGuard();
  const [token, setToken] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get("token");
    if (queryToken) setToken(queryToken);
  }, [searchParams]);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
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
        <form onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <Field
            label="Token de invitación"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Token del enlace"
            required
          />
          <Field
            label="Parentesco (opcional)"
            value={parentesco}
            onChange={(event) => setParentesco(event.target.value)}
            placeholder="Ej. hija, hijo, madre"
            maxLength={80}
          />
          <Button type="submit" disabled={joining || !token.trim()}>
            {joining ? "Uniéndome..." : "Unirme al grupo"}
          </Button>
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
