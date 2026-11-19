"use client";

import { Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Card, Loading, Page } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { getPendingInviteCode } from "@/lib/session";

const primaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-label-large font-semibold text-on-primary transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-outline px-6 text-label-large font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function FamilySelectPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [codeChecked, setCodeChecked] = useState(false);

  useEffect(() => {
    setPendingCode(getPendingInviteCode());
    setCodeChecked(true);
  }, []);

  useEffect(() => {
    if (ready && session && !session.needs_family_setup) {
      router.replace("/");
    }
  }, [ready, session, router]);

  if (!ready || !session || !codeChecked) return <Loading />;
  if (!session.needs_family_setup) return <Loading message={t("common.redirecting")} />;

  const hasPendingCode = Boolean(pendingCode);

  const createCard = (
    <Card variant={hasPendingCode ? "outlined" : "elevated"} className="space-y-4">
      <div className="flex items-center gap-3 text-primary">
        <Users size={28} aria-hidden="true" />
        <h2 className="text-title-large text-on-surface">{t("family.createHeading")}</h2>
      </div>
      <p className="text-body-large text-on-surface-variant">{t("family.createBody")}</p>
      <Link
        href="/family/create"
        className={hasPendingCode ? secondaryLinkClass : primaryLinkClass}
      >
        {t("family.createCta")}
      </Link>
    </Card>
  );

  const joinCard = hasPendingCode ? (
    <Card variant="elevated" className="space-y-4">
      <div className="flex items-center gap-3 text-primary">
        <UserPlus size={28} aria-hidden="true" />
        <h2 className="text-title-large text-on-surface">{t("family.joinWithCodeTitle")}</h2>
      </div>
      <p className="text-body-large text-on-surface-variant">{t("family.joinWithCodeBody")}</p>
      <Link href="/invite" className={primaryLinkClass}>
        {t("family.joinWithCodeCta")}
      </Link>
    </Card>
  ) : (
    <Card variant="outlined" className="space-y-4">
      <div className="flex items-center gap-3 text-primary">
        <UserPlus size={28} aria-hidden="true" />
        <h2 className="text-title-large text-on-surface">{t("family.invitedHeading")}</h2>
      </div>
      <p className="text-body-large text-on-surface-variant">{t("family.invitedBody")}</p>
      <Link href="/invite" className={secondaryLinkClass}>
        {t("family.invitedCta")}
      </Link>
    </Card>
  );

  return (
    <Page title={t("family.selectTitle")} subtitle={t("family.selectSubtitle")}>
      {hasPendingCode ? joinCard : createCard}
      {hasPendingCode ? createCard : joinCard}
    </Page>
  );
}