"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/components/providers/LocaleProvider";
import { AvatarEditor, Card, Loading, Page } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function ProfileAvatarPage() {
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);

  if (!ready || !session) return <Loading />;

  return (
    <Page
      title={t("avatar.title")}
      subtitle={t("avatar.subtitle")}
      actions={
        <Link
          href="/profile/edit"
          className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-label-large text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t("profile.backToProfile")}
        </Link>
      }
    >
      <Card variant="elevated">
        <AvatarEditor seed={session.user.email || session.user.id} />
      </Card>
    </Page>
  );
}
