import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "../../../components/providers/LocaleProvider";
import { Avatar, Button, Card, ErrorMessage, Field, Loading, Page } from "../../../components/ui";
import { api } from "../../../lib/api";
import {
  AVATAR_MAX_LENGTH,
  createDefaultAvatar,
  isAvatarDataUri,
} from "../../../lib/avatar-engine.generated";
import { errorText } from "../../../lib/errors";
import { getPendingInviteToken, updateSession } from "../../../lib/session";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

export default function ProfileSetupScreen() {
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
      void (async () => {
        const destination = session.needs_family_setup
          ? (await getPendingInviteToken())
            ? "/invite"
            : "/family/select"
          : "/family/members";
        router.replace(destination);
      })();
    }
  }, [ready, session, router]);

  const handleSubmit = async () => {
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

      await updateSession({
        user: {
          ...session.user,
          ...updated,
        },
        needs_profile_setup: false,
      });

      const destination = session.needs_family_setup
        ? (await getPendingInviteToken())
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
      <Card>
        <ErrorMessage message={error} />
        <Avatar name={nombre || session.user.email} seed={seed} src={avatar} size="xl" />
        <Field
          label={t("profile.displayName")}
          value={nombre}
          onChangeText={setNombre}
          placeholder={t("profile.displayNamePlaceholder")}
          maxLength={120}
        />
        <Button
          title={saving ? t("common.saving") : t("profile.saveAndContinue")}
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
        />
      </Card>
    </Page>
  );
}