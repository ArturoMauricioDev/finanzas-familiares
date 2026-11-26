"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CurrencySelect } from "@/components/family/CurrencySelect";
import { useI18n } from "@/components/providers/LocaleProvider";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorMessage,
  Field,
  Loading,
  Page,
  RadioGroup,
  Stepper,
} from "@/components/ui";
import { api } from "@/lib/api";
import { createCurrencySelection, isValidCurrencyCode } from "@/lib/currency";
import { errorDescriptorText, toErrorDescriptor, type ErrorDescriptor } from "@/lib/errors";
import { detectCountry } from "@/lib/geolocation";
import { applyFamilyCreated, clearPendingInviteCode } from "@/lib/session";
import {
  rehydrateFamilyDraft,
  useFamilyDraft,
  type FamilyCreatorRole,
} from "@/lib/store/familyDraft";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const TOTAL_STEPS = 3;

export default function FamilyCreatePage() {
  const router = useRouter();
  const { formatLocale, t } = useI18n();
  const { session, ready } = useAuthGuard();

  const step = useFamilyDraft((state) => state.step);
  const nombre = useFamilyDraft((state) => state.nombre);
  const moneda = useFamilyDraft((state) => state.moneda);
  const rolFamiliar = useFamilyDraft((state) => state.rolFamiliar);
  const hydrated = useFamilyDraft((state) => state.hydrated);
  const setNombre = useFamilyDraft((state) => state.setNombre);
  const setMoneda = useFamilyDraft((state) => state.setMoneda);
  const setRole = useFamilyDraft((state) => state.setRole);
  const goTo = useFamilyDraft((state) => state.goTo);
  const next = useFamilyDraft((state) => state.next);
  const back = useFamilyDraft((state) => state.back);
  const reset = useFamilyDraft((state) => state.reset);

  const [selection, setSelection] = useState(() =>
    createCurrencySelection({ locale: formatLocale }),
  );
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState<ErrorDescriptor | null>(null);
  const [saving, setSaving] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      reset();
      router.replace("/");
    }
  }, [ready, session, router, reset]);

  useEffect(() => {
    let active = true;
    void rehydrateFamilyDraft().then(() => {
      if (!active) return;
      void detectCountry({ locale: formatLocale }).then((result) => {
        if (!active) return;
        const detected = createCurrencySelection({
          country: result.country,
          locale: formatLocale,
          source: result.source,
        });
        setSelection(detected);
        setDetecting(false);
        if (!useFamilyDraft.getState().moneda) {
          setMoneda(detected.selectedCode);
        }
      });
    });
    return () => {
      active = false;
    };
  }, [formatLocale, setMoneda]);

  useEffect(() => {
    if (hydrated) headingRef.current?.focus();
  }, [step, hydrated]);

  const stepTitles = useMemo(
    () => [
      t("family.wizardStepNameTitle"),
      t("family.wizardStepCurrencyTitle"),
      t("family.wizardStepRoleTitle"),
    ],
    [t],
  );

  const nombreValid = nombre.trim().length >= 1 && nombre.trim().length <= 120;
  const monedaValid = isValidCurrencyCode(moneda);
  const hasDraft = nombre.trim().length > 0;

  const handleExit = () => {
    reset();
    router.push("/family/select");
  };

  const handleSubmit = async () => {
    if (!nombreValid) {
      goTo(1);
      return;
    }
    if (!monedaValid) {
      goTo(2);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = await api.createFamily({
        nombre: nombre.trim(),
        moneda_local: moneda,
        rol_familiar: rolFamiliar,
      });
      applyFamilyCreated(data);
      clearPendingInviteCode();
      reset();
      router.replace("/");
    } catch (err) {
      const descriptor = toErrorDescriptor(err);
      if (descriptor.status === 422) {
        goTo(2);
      }
      setError(descriptor);
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session || !hydrated) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  const progressLabel = t("family.wizardProgress", { current: step, total: TOTAL_STEPS });
  const announce = t("family.wizardStepAnnounce", {
    current: step,
    total: TOTAL_STEPS,
    title: stepTitles[step - 1],
  });

  return (
    <Page title={t("family.createTitle")} subtitle={t("family.createSubtitle")}>
      <Card variant="elevated">
        <div className="space-y-5">
          <Stepper
            current={step}
            total={TOTAL_STEPS}
            titles={stepTitles}
            progressLabel={progressLabel}
            announce={announce}
          />

          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-title-large text-on-surface focus:outline-none"
          >
            {stepTitles[step - 1]}
          </h2>

          <ErrorMessage
            message={error ? errorDescriptorText(error, t, t("family.createFailed")) : null}
          />

          {step === 1 ? (
            <Field
              label={t("family.nameLabel")}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder={t("family.namePlaceholder")}
              hint={t("family.wizardStepNameHint")}
              required
              maxLength={120}
            />
          ) : null}

          {step === 2 ? (
            <CurrencySelect
              label={t("family.currencyLabel")}
              value={moneda}
              suggestions={selection.suggested}
              localCode={selection.suggested.find((option) => option.isLocal)?.code ?? null}
              loading={detecting}
              disabled={saving}
              onChange={setMoneda}
            />
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="space-y-1 rounded-sm bg-surface-container-high p-4">
                <p className="text-label-large font-semibold text-on-surface">
                  {t("family.wizardSummaryTitle")}
                </p>
                <p className="text-body-medium text-on-surface">
                  {t("family.wizardSummaryName", { name: nombre.trim() })}
                </p>
                <p className="text-body-medium text-on-surface">
                  {t("family.wizardSummaryCurrency", { currency: moneda })}
                </p>
              </div>
              <RadioGroup
                name="family-creator-role"
                legend={t("family.creatorRoleLabel")}
                value={rolFamiliar}
                options={[
                  { value: "padre", label: t("family.familyRolePadre") },
                  { value: "madre", label: t("family.familyRoleMadre") },
                ]}
                onChange={(value) => setRole(value as FamilyCreatorRole)}
              />
              <p className="text-body-small text-on-surface-variant">{t("family.wizardRoleHint")}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {step > 1 ? (
              <Button variant="secondary" onClick={back} disabled={saving}>
                {t("family.wizardBack")}
              </Button>
            ) : null}
            {step < TOTAL_STEPS ? (
              <Button
                onClick={next}
                disabled={(step === 1 && !nombreValid) || (step === 2 && !monedaValid)}
              >
                {t("family.wizardContinue")}
              </Button>
            ) : (
              <Button
                onClick={() => void handleSubmit()}
                loading={saving}
                disabled={saving || !nombreValid || !monedaValid}
              >
                {t("family.createFamily")}
              </Button>
            )}
            <Button
              variant="text"
              onClick={() => (hasDraft ? setExitOpen(true) : handleExit())}
              disabled={saving}
            >
              {t("family.wizardExit")}
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={exitOpen}
        title={t("family.wizardExitConfirmTitle")}
        description={t("family.wizardExitConfirmBody")}
        confirmLabel={t("family.wizardExitConfirm")}
        cancelLabel={t("common.cancel")}
        destructive
        disabled={saving}
        onCancel={() => setExitOpen(false)}
        onConfirm={handleExit}
      />
    </Page>
  );
}
