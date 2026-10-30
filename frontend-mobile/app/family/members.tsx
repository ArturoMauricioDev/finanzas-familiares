import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, Share, Text, View } from "react-native";

import { Button, Card, ErrorMessage, Loading, Page, SuccessMessage } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { clearSession } from "../../lib/session";
import type { FamilyDetail, Invitation } from "../../lib/types";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function FamilyMembersScreen() {
  const router = useRouter();
  const { session, ready } = useAuthGuard(true);
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleError = useCallback(
    async (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        await clearSession();
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
      await handleError(err);
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
      await handleError(err);
    }
  };

  const shareInvitation = async () => {
    if (!invitation) return;
    await Share.share({ message: `Únete a mi grupo familiar: ${invitation.link}` });
  };

  const promote = async (userId: string) => {
    setError(null);
    setMessage(null);
    try {
      await api.promoteMember(userId);
      setMessage("Miembro promovido a administrador.");
      await loadFamily();
    } catch (err) {
      await handleError(err);
    }
  };

  const confirmRemove = (userId: string) => {
    Alert.alert("Dar de baja", "¿Dar de baja a este miembro del grupo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Dar de baja",
        style: "destructive",
        onPress: async () => {
          setError(null);
          setMessage(null);
          try {
            await api.removeMember(userId);
            setMessage("Miembro dado de baja.");
            await loadFamily();
          } catch (err) {
            await handleError(err);
          }
        },
      },
    ]);
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
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Integrantes</Text>
          {family.members.map((member) => (
            <View
              key={member.user_id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                {member.foto_avatar ? (
                  <Image
                    source={{ uri: member.foto_avatar }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                ) : (
                  <View
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#e2e8f0" }}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700" }}>
                    {member.nombre_visualizacion || "Sin nombre"}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>
                    {member.role === "admin" ? "Administrador" : "Miembro"}
                    {member.parentesco ? ` · ${member.parentesco}` : ""}
                    {member.user_id === session.user.id ? " · Tú" : ""}
                  </Text>
                </View>
              </View>

              {isAdmin && member.user_id !== session.user.id ? (
                <View style={{ gap: 6 }}>
                  {member.role !== "admin" ? (
                    <Button
                      title="Promover"
                      variant="secondary"
                      onPress={() => promote(member.user_id)}
                    />
                  ) : null}
                  <Button
                    title="Expulsar"
                    variant="danger"
                    onPress={() => confirmRemove(member.user_id)}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
            Invitar a un integrante
          </Text>
          <Text style={{ color: "#475569", marginBottom: 12 }}>
            Genera un enlace de un solo uso. El grupo admite hasta 10 miembros activos.
          </Text>
          <Button title="Generar invitación" onPress={generateInvitation} />
          {invitation ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text selectable style={{ color: "#0f172a" }}>
                {invitation.link}
              </Text>
              <Button title="Compartir enlace" variant="secondary" onPress={shareInvitation} />
            </View>
          ) : null}
        </Card>
      ) : null}
    </Page>
  );
}
