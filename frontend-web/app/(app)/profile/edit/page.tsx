"use client";

import { ArrowLeft, Wand2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import {
  Avatar,
  Button,
  Card,
  ErrorMessage,
  Field,
  Loading,
  Page,
  SuccessMessage,
} from "@/components/ui";
import { api } from "@/lib/api";
import { errorText } from "@/lib/errors";
import { updateSession } from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function ProfileEditPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);
  const [nombre, setNombre] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setNombre(session.user.nombre_visualizacion ?? "");
      setAvatar(session.user.foto_avatar ?? "");
    }
  }, [session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await api.updateProfile({
        nombre_visualizacion: nombre,
        foto_avatar: avatar,
      });
      updateSession({
        user: { ...session.user, ...updated },
      });
      setMessage(t("profile.updated"));
      router.push("/profile");
    } catch (err) {
      setError(errorText(err, t, t("profile.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session) return <Loading />;

  return (
    <Page
      title={t("profile.editTitle")}
      subtitle={t("profile.editSubtitle")}
      actions={
        <Link
          href="/profile"
          className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-label-large text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t("profile.backToProfile")}
        </Link>
      }
    >
      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage message={error} />
          <SuccessMessage message={message} />
          <div className="flex items-center gap-4">
            <Avatar
              name={nombre || session.user.email}
              seed={session.user.email || session.user.id}
              src={avatar}
              size="xl"
            />
            <Link
              href="/profile/avatar"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-outline px-4 text-label-large text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Wand2 size={18} aria-hidden="true" />
              {t("profile.editAvatar")}
            </Link>
          </div>
          <Field
            label={t("profile.displayName")}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder={t("profile.displayNamePlaceholder")}
            required
            maxLength={120}
          />
          <Field
            label={t("profile.avatarUrl")}
            value={avatar}
            onChange={(event) => setAvatar(event.target.value)}
            placeholder={t("profile.avatarUrlPlaceholder")}
            maxLength={2048}
          />
          <Button type="submit" loading={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </Card>
    </Page>
  );
}
