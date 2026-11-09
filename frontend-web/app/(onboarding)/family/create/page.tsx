"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CurrencySelect } from "@/components/family/CurrencySelect";
import { useI18n } from "@/components/providers/LocaleProvider";
import { Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { api } from "@/lib/api";
import { createCurrencySelection, isValidCurrencyCode } from "@/lib/currency";
import { errorText } from "@/lib/errors";
import { detectCountry } from "@/lib/geolocation";
import { applyFamilyCreated, clearPendingInviteCode } from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function FamilyCreatePage() {
  const router = useRouter();
  const { formatLocale, t } = useI18n();
  const { session, ready } = useAuthGuard();
  const [nombre, setNombre] = useState("");
  const [selection, setSelection] = useState(() => createCurrencySelection({ locale: formatLocale }));
  const [moneda, setMoneda] = useState(() => createCurrencySelection({ locale: formatLocale }).selectedCode);
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/family/members");
    }
  }, [ready, session, router]);

  useEffect(() => {
    let active = true;
    void detectCountry({ locale: formatLocale }).then((result) => {
      if (!active) return;
      const next = createCurrencySelection({
        country: result.country,
        locale: formatLocale,
        source: result.source,
      });
      setSelection(next);
      setMoneda(next.selectedCode);
      setDetecting(false);
    });
    return () => {
      active = false;
    };
  }, [formatLocale]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValidCurrencyCode(moneda)) {
      setError(t("family.currencyInvalid"));
      return;
    }

    setSaving(true);

    try {
      const data = await api.createFamily({
        nombre,
        moneda_local: moneda,
      });
      applyFamilyCreated(data);
      clearPendingInviteCode();
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
          <CurrencySelect
            label={t("family.currencyLabel")}
            value={moneda}
            suggestions={selection.suggested}
            localCode={selection.detectedCountry ? moneda : null}
            loading={detecting}
            disabled={saving}
            onChange={setMoneda}
          />
          <Button type="submit" loading={saving}>
            {saving ? t("common.creating") : t("family.createFamily")}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
