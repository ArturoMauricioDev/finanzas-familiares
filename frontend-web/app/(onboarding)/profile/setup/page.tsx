"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Avatar, Button, Card, ErrorMessage, Field, Loading, Page } from "@/components/ui";
import { api } from "@/lib/api";
import {
  AVATAR_MAX_LENGTH,
  createDefaultAvatar,
  isAvatarDataUri,
} from "@/lib/avatar-engine.generated";
import { errorText } from "@/lib/errors";
import { getPendingInviteToken, updateSession } from "@/lib/session";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const seed = session?.user.email || session?.user.id || "kitho";
  const defaultAvatar = useMemo(() => createDefaultAvatar(seed), [seed]);
  const avatar = useMemo(() => {
    const current = session?.user.foto_avatar;
    return isAvatarDataUri(current) ? (current as string) : defaultAvatar;
  }, [session, defaultAvatar]);

  useEffect(() => {
    if (session?.user) {
      setNombre(session.user.nombre_visualizacion ?? "");
    }
  }, [session]);

  useEffect(() => {
    if (!ready || !session) return;
    if (!session.needs_profile_setup) {
      const destination = session.needs_family_setup
        ? getPendingInviteToken()
          ? "/invite"
          : "/family/select"
        : "/family/members";
      router.replace(destination);
    }
  }, [ready, session, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session) return;

    setSaving(true);
    setError(null);

    try {
      if (avatar.length > AVATAR_MAX_LENGTH) {
        setError(t("avatar.svgUnsupported"));
        return;
      }

      const updated = await api.updateProfile({
        nombre_visualizacion: nombre,
        foto_avatar: avatar,
      });

      updateSession({
        user: {
          ...session.user,
          ...updated,
        },
        needs_profile_setup: false,
      });

      const destination = session.needs_family_setup
        ? getPendingInviteToken()
          ? "/invite"
          : "/family/select"
        : "/family/members";
      router.replace(destination);
    } catch (err) {
      setError(errorText(err, t, t("profile.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session) return <Loading />;

  return (
    <Page title={t("profile.setupTitle")} subtitle={t("profile.setupSubtitle")}>
      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage message={error} />
          <div className="flex items-center gap-4">
            <Avatar
              name={nombre || session.user.email}
              seed={seed}
              src={avatar}
              size="xl"
            />
            <p className="text-body-medium text-on-surface-variant">{t("avatar.previewOnly")}</p>
          </div>
          <Field
            label={t("profile.displayName")}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder={t("profile.displayNamePlaceholder")}
            required
            maxLength={120}
          />
          <Button type="submit" loading={saving}>
            {saving ? t("common.saving") : t("profile.saveAndContinue")}
          </Button>
        </form>
      </Card>
    </Page>
  );
}