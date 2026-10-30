"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, Card, ErrorMessage, Loading, Page, SuccessMessage } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { clearSession } from "@/lib/session";
import type { FamilyDetail, Invitation } from "@/lib/types";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function FamilyMembersPage() {
  const router = useRouter();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        router.replace("/auth/login");
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        router.replace("/family/select");
        return;
      }
      setError(err instanceof Error ? err.message : "No se pudo cargar el grupo.");
    },
    [router],
  );

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFamily();
      setFamily(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (ready && session) {
      loadFamily();
    }
  }, [ready, session, loadFamily]);

  const generateInvitation = async () => {
    setError(null);
    setMessage(null);
    try {
      const data = await api.createInvitation();
      setInvitation(data);
      setMessage("Invitación generada. Comparte el enlace con tu familia.");
    } catch (err) {
      handleError(err);
    }
  };

  const copyLink = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.link);
      setMessage("Enlace copiado al portapapeles.");
    } catch {
      setMessage("No se pudo copiar automáticamente. Copia el enlace manualmente.");
    }
  };

  const promote = async (userId: string) => {
    setError(null);
    setMessage(null);
    try {
      await api.promoteMember(userId);
      setMessage("Miembro promovido a administrador.");
      await loadFamily();
    } catch (err) {
      handleError(err);
    }
  };

  const remove = async (userId: string) => {
    if (!window.confirm("¿Dar de baja a este miembro del grupo?")) return;
    setError(null);
    setMessage(null);
    try {
      await api.removeMember(userId);
      setMessage("Miembro dado de baja.");
      await loadFamily();
    } catch (err) {
      handleError(err);
    }
  };

  if (!ready || !session) return <Loading />;

  const currentMember = family?.members.find((member) => member.user_id === session.user.id);
  const isAdmin = currentMember?.role === "admin";

  return (
    <Page
      title={family?.family.nombre ?? "Mi grupo familiar"}
      subtitle={
        family
          ? `Moneda local: ${family.family.moneda_local} · ${family.member_count} de 10 miembros`
          : "Cargando información del grupo..."
      }
    >
      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      {loading ? <Loading /> : null}

      {family ? (
        <Card>
          <h2 style={{ marginTop: 0 }}>Integrantes</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {family.members.map((member) => (
              <li
                key={member.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {member.foto_avatar ? (
                    <Image
                      src={member.foto_avatar}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#e2e8f0",
                        display: "inline-block",
                      }}
                    />
                  )}
                  <div>
                    <strong>{member.nombre_visualizacion || "Sin nombre"}</strong>
                    <div style={{ color: "#64748b", fontSize: 13 }}>
                      {member.role === "admin" ? "Administrador" : "Miembro"}
                      {member.parentesco ? ` · ${member.parentesco}` : ""}
                      {member.user_id === session.user.id ? " · Tú" : ""}
                    </div>
                  </div>
                </div>

                {isAdmin && member.user_id !== session.user.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    {member.role !== "admin" ? (
                      <Button variant="secondary" onClick={() => promote(member.user_id)}>
                        Promover
                      </Button>
                    ) : null}
                    <Button variant="danger" onClick={() => remove(member.user_id)}>
                      Expulsar
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <h2 style={{ marginTop: 0 }}>Invitar a un integrante</h2>
          <p style={{ color: "#475569" }}>
            Genera un enlace de un solo uso. El grupo admite hasta 10 miembros activos.
          </p>
          <Button onClick={generateInvitation}>Generar invitación</Button>

          {invitation ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ wordBreak: "break-all" }}>{invitation.link}</p>
              <Button variant="secondary" onClick={copyLink}>
                Copiar enlace
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </Page>
  );
}
