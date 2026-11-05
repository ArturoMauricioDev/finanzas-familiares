"use client";

import { Palette, Pencil, Settings } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Avatar, Card, Loading, Page } from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";

const actionClass =
  "inline-flex min-h-12 items-center gap-2 rounded-full border border-outline px-5 text-label-large font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function ProfilePage() {
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);

  if (!ready || !session) return <Loading />;

  const user = session.user;
  const roleLabel = user.role === "admin" ? t("family.adminRole") : t("family.memberRole");

  return (
    <Page title={t("nav.profile")} subtitle={user.email}>
      <Card variant="elevated" className="space-y-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar
            name={user.nombre_visualizacion}
            seed={user.email || user.id}
            src={user.foto_avatar}
            size="xl"
          />
          <div className="space-y-1">
            <h2 className="text-headline-small text-on-surface">
              {user.nombre_visualizacion || t("common.noName")}
            </h2>
            <p className="text-body-medium text-on-surface-variant">{user.email}</p>
            {user.family_id ? (
              <p className="text-body-small text-on-surface-variant">{roleLabel}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/edit" className={actionClass}>
            <Pencil size={18} aria-hidden="true" />
            {t("profile.editTitle")}
          </Link>
          <Link href="/profile/avatar" className={actionClass}>
            <Palette size={18} aria-hidden="true" />
            {t("profile.editAvatar")}
          </Link>
          <Link href="/settings" className={actionClass}>
            <Settings size={18} aria-hidden="true" />
            {t("nav.settings")}
          </Link>
        </div>
      </Card>
    </Page>
  );
}
