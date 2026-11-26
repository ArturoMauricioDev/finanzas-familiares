import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, Text, View, findNodeHandle } from "react-native";

import { CurrencySelect } from "../../../components/family/CurrencySelect";
import { useI18n } from "../../../components/providers/LocaleProvider";
import { useTheme } from "../../../components/providers/ThemeProvider";
import {
  Button,
  Card,
  ChoiceGroup,
  Dialog,
  ErrorMessage,
  Field,
  Loading,
  Page,
  Stepper,
} from "../../../components/ui";
import { api } from "../../../lib/api";
import { createCurrencySelection, isValidCurrencyCode } from "../../../lib/currency";
import {
  errorDescriptorText,
  toErrorDescriptor,
  type ErrorDescriptor,
} from "../../../lib/errors";
import { detectCountry } from "../../../lib/geolocation";
import { shape, spacing } from "../../../lib/generated/tokens";
import { applyFamilyCreated, clearPendingInviteCode } from "../../../lib/session";
import {
  rehydrateFamilyDraft,
  useFamilyDraft,
  type FamilyCreatorRole,
} from "../../../lib/store/familyDraft";
import { typeStyle } from "../../../lib/ui-styles";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

const TOTAL_STEPS = 3;

export default function FamilyCreateScreen() {
  const router = useRouter();
  const { formatLocale, t } = useI18n();
  const { colors } = useTheme();
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
  const headingRef = useRef<ComponentRef<typeof Text>>(null);

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
    if (!hydrated) return;
    const node = headingRef.current;
    if (!node) return;
    try {
      const handle = findNodeHandle(node as unknown as Parameters<typeof findNodeHandle>[0]);
      if (handle != null) {
        AccessibilityInfo.setAccessibilityFocus(handle);
      }
    } catch {
      return;
    }  }, [step, hydrated]);

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
      await applyFamilyCreated(data);
      await clearPendingInviteCode();
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
      <Card>
        <Stepper
          current={step}
          total={TOTAL_STEPS}
          titles={stepTitles}
          progressLabel={progressLabel}
          announce={announce}
        />

        <Text
          ref={headingRef}
          accessibilityRole="header"
          accessible
          style={[typeStyle("titleLarge"), { color: colors.onSurface }]}
        >
          {stepTitles[step - 1]}
        </Text>

        <ErrorMessage
          message={error ? errorDescriptorText(error, t, t("family.createFailed")) : null}
        />

        {step === 1 ? (
          <Field
            label={t("family.nameLabel")}
            value={nombre}
            onChangeText={setNombre}
            placeholder={t("family.namePlaceholder")}
            hint={t("family.wizardStepNameHint")}
            maxLength={120}
            aria-required
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
          <View style={{ gap: spacing[3] }}>
            <View
              style={{
                backgroundColor: colors.surfaceContainerHigh,
                borderRadius: shape.sm,
                padding: spacing[3],
                gap: spacing[1],
              }}
            >
              <Text style={[typeStyle("labelLarge"), { color: colors.onSurface }]}>
                {t("family.wizardSummaryTitle")}
              </Text>
              <Text style={[typeStyle("bodyMedium"), { color: colors.onSurface }]}>
                {t("family.wizardSummaryName", { name: nombre.trim() })}
              </Text>
              <Text style={[typeStyle("bodyMedium"), { color: colors.onSurface }]}>
                {t("family.wizardSummaryCurrency", { currency: moneda })}
              </Text>
            </View>
            <ChoiceGroup
              legend={t("family.creatorRoleLabel")}
              value={rolFamiliar}
              options={[
                { value: "padre", label: t("family.familyRolePadre") },
                { value: "madre", label: t("family.familyRoleMadre") },
              ]}
              onChange={(value) => setRole(value as FamilyCreatorRole)}
            />
            <Text style={[typeStyle("bodySmall"), { color: colors.onSurfaceVariant }]}>
              {t("family.wizardRoleHint")}
            </Text>
          </View>
        ) : null}

        {step > 1 ? (
          <Button
            title={t("family.wizardBack")}
            variant="secondary"
            onPress={back}
            disabled={saving}
          />
        ) : null}
        {step < TOTAL_STEPS ? (
          <Button
            title={t("family.wizardContinue")}
            onPress={next}
            disabled={(step === 1 && !nombreValid) || (step === 2 && !monedaValid)}
          />
        ) : (
          <Button
            title={t("family.createFamily")}
            onPress={() => void handleSubmit()}
            loading={saving}
            disabled={saving || !nombreValid || !monedaValid}
          />
        )}
        <Button
          title={t("family.wizardExit")}
          variant="text"
          onPress={() => (hasDraft ? setExitOpen(true) : handleExit())}
          disabled={saving}
        />
      </Card>

      <Dialog
        open={exitOpen}
        title={t("family.wizardExitConfirmTitle")}
        onClose={() => setExitOpen(false)}
        closeLabel={t("common.cancel")}
      >
        <Text style={[typeStyle("bodyMedium"), { color: colors.onSurfaceVariant }]}>
          {t("family.wizardExitConfirmBody")}
        </Text>
        <Button
          title={t("family.wizardExitConfirm")}
          variant="danger"
          onPress={handleExit}
        />
      </Dialog>
    </Page>
  );
}
