"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { api } from "@/lib/api";
import { errorText } from "@/lib/errors";
import { applyFamilyCreated, clearPendingInviteToken } from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function FamilyCreatePage() {
  const router = useRouter();
  const { t } = useI18n();
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const data = await api.createFamily({
        nombre,
        moneda_local: moneda,
      });
      applyFamilyCreated(data);
      clearPendingInviteToken();
      router.replace("/family/members");
    } catch (err) {
      setError(errorText(err, t, t("family.createFailed")));
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  return (
    <Page title={t("family.createTitle")} subtitle={t("family.createSubtitle")}>
      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage message={error} />
          <Field
            label={t("family.nameLabel")}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder={t("family.namePlaceholder")}
            required
            maxLength={120}
          />
          <Field
            label={t("family.currencyLabel")}
            value={moneda}
            onChange={(event) => setMoneda(event.target.value.toUpperCase())}
            placeholder={t("family.currencyPlaceholder")}
            required
            minLength={3}
            maxLength={3}
            hint={t("family.currencyHint")}
          />
          <Button type="submit" loading={saving}>
            {saving ? t("common.creating") : t("family.createFamily")}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
