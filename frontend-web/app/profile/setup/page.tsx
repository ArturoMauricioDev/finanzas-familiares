"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { api } from "@/lib/api";
import { updateSession } from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { session, ready } = useAuthGuard();
  const [nombre, setNombre] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setNombre(session.user.nombre_visualizacion ?? "");
      setAvatar(session.user.foto_avatar ?? "");
    }
  }, [session]);

  useEffect(() => {
    if (!ready || !session) return;
    if (!session.needs_profile_setup) {
      router.replace(session.needs_family_setup ? "/family/select" : "/family/members");
    }
  }, [ready, session, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await api.updateProfile({
        nombre_visualizacion: nombre,
        foto_avatar: avatar,
      });

      updateSession({
        user: {
          ...session.user,
          ...updated,
        },
        needs_profile_setup: false,
      });

      router.replace(session.needs_family_setup ? "/family/select" : "/family/members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session) return <Loading />;

  return (
    <Page
      title="Completa tu perfil"
      subtitle="Necesitamos tu nombre visible y una foto para identificarte en el grupo familiar."
    >
      <Card>
        <form onSubmit={handleSubmit}>
          <ErrorMessage message={error} />
          <Field
            label="Nombre de visualización"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej. Ana Pérez"
            required
            maxLength={120}
          />
          <Field
            label="URL de la foto de avatar"
            value={avatar}
            onChange={(event) => setAvatar(event.target.value)}
            placeholder="https://..."
            required
            maxLength={2048}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
