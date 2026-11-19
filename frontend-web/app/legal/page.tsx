"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Card, Page } from "@/components/ui";

const backLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-outline px-5 text-label-large font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function LegalPage() {
  const { t } = useI18n();

  return (
    <Page
      title={t("legal.title")}
      subtitle={t("legal.body")}
      actions={
        <Link href="/" className={backLinkClass}>
          {t("common.back")}
        </Link>
      }
    >
      <Card variant="elevated" className="space-y-2">
        <h2 className="text-title-large text-on-surface">{t("legal.privacyHeading")}</h2>
        <p className="text-body-medium text-on-surface-variant">{t("legal.privacyBody")}</p>
      </Card>

      <Card variant="elevated" className="space-y-2">
        <h2 className="text-title-large text-on-surface">{t("legal.termsHeading")}</h2>
        <p className="text-body-medium text-on-surface-variant">{t("legal.termsBody")}</p>
      </Card>
    </Page>
  );
}