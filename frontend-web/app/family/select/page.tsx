"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Card, Loading, Page } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function FamilySelectPage() {
  const router = useRouter();
  const { session, ready } = useAuthGuard();

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message="Redirigiendo..." />;

  return (
    <Page
      title="Elige tu grupo familiar"
      subtitle="Para usar las funciones financieras debes crear un grupo o unirte a uno existente."
    >
      <Card>
        <h2 style={{ marginTop: 0 }}>Crear un grupo familiar</h2>
        <p style={{ color: "#475569" }}>
          Define el nombre y la moneda del núcleo familiar. Serás el administrador.
        </p>
        <Link href="/family/create">
          <span
            style={{
              display: "inline-block",
              background: "#0f766e",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Crear nuevo grupo familiar
          </span>
        </Link>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0 }}>Unirme mediante enlace</h2>
        <p style={{ color: "#475569" }}>
          Usa el enlace o token de invitación que compartió un administrador.
        </p>
        <Link href="/invite">
          <span
            style={{
              display: "inline-block",
              border: "1px solid #cbd5e1",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Unirme mediante enlace
          </span>
        </Link>
      </Card>
    </Page>
  );
}
