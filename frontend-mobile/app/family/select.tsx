import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";

import { Button, Card, Loading, Page } from "../../components/ui";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function FamilySelectScreen() {
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
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Crear un grupo familiar
        </Text>
        <Text style={{ color: "#475569", marginBottom: 12 }}>
          Define el nombre y la moneda del núcleo familiar. Serás el administrador.
        </Text>
        <Button title="Crear nuevo grupo familiar" onPress={() => router.push("/family/create")} />
      </Card>

      <Card>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Unirme mediante enlace
        </Text>
        <Text style={{ color: "#475569", marginBottom: 12 }}>
          Usa el enlace o token de invitación que compartió un administrador.
        </Text>
        <Button
          title="Unirme mediante enlace"
          variant="secondary"
          onPress={() => router.push("/invite")}
        />
      </Card>
    </Page>
  );
}
