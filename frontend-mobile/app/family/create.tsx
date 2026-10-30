import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { Button, Card, ErrorMessage, Field, Loading, Page } from "../../components/ui";
import { api } from "../../lib/api";
import { applyFamilyCreated } from "../../lib/session";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function FamilyCreateScreen() {
  const router = useRouter();
  const { session, ready } = useAuthGuard();
  const [nombre, setNombre] = useState("");
  const [moneda, setMoneda] = useState("MXN");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const data = await api.createFamily({
        nombre,
        moneda_local: moneda,
      });
      await applyFamilyCreated(data);
      router.replace("/family/members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el grupo.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message="Redirigiendo..." />;

  return (
    <Page
      title="Crear grupo familiar"
      subtitle="El grupo tendrá una sola moneda local para todos sus registros."
    >
      <Card>
        <ErrorMessage message={error} />
        <Field
          label="Nombre de la familia"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Familia Pérez"
          maxLength={120}
        />
        <Field
          label="Moneda local (ISO 4217)"
          value={moneda}
          onChangeText={(value) => setMoneda(value.toUpperCase())}
          placeholder="MXN"
          maxLength={3}
          hint="Código de 3 letras, por ejemplo MXN, COP, USD o EUR."
        />
        <Button
          title={saving ? "Creando..." : "Crear grupo"}
          onPress={handleSubmit}
          disabled={saving}
        />
      </Card>
    </Page>
  );
}
