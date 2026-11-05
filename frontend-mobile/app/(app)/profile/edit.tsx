import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useI18n } from "../../../components/providers/LocaleProvider";
import {
  Avatar,
  Button,
  Card,
  ErrorMessage,
  Field,
  Loading,
  Page,
  SuccessMessage,
} from "../../../components/ui";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { api } from "../../../lib/api";
import { errorText } from "../../../lib/errors";
import { updateSession } from "../../../lib/session";

export default function ProfileEditScreen() {
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

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/profile");
  };

  const handleSubmit = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.updateProfile({
        nombre_visualizacion: nombre,
        foto_avatar: avatar,
      });
      await updateSession({ user: { ...session.user, ...updated } });
      setMessage(t("profile.updated"));
      goBack();
    } catch (err) {
      setError(errorText(err, t, t("profile.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !session) return <Loading />;

  return (
    <Page title={t("profile.editTitle")} subtitle={t("profile.editSubtitle")} onBack={goBack}>
      <Card>
        <ErrorMessage message={error} />
        <SuccessMessage message={message} />
        <Avatar
          name={nombre || session.user.email}
          seed={session.user.email || session.user.id}
          src={avatar}
          size="xl"
        />
        <Field
          label={t("profile.displayName")}
          value={nombre}
          onChangeText={setNombre}
          placeholder={t("profile.displayNamePlaceholder")}
          maxLength={120}
          autoCapitalize="words"
        />
        <Field
          label={t("profile.avatarUrl")}
          value={avatar}
          onChangeText={setAvatar}
          placeholder={t("profile.avatarUrlPlaceholder")}
          maxLength={2048}
        />
        <Button
          title={t("profile.editAvatar")}
          variant="secondary"
          onPress={() => router.push("/profile/avatar")}
        />
        <Button
          title={saving ? t("common.saving") : t("common.save")}
          onPress={() => void handleSubmit()}
          loading={saving}
        />
        <Button title={t("profile.backToProfile")} variant="text" onPress={goBack} />
      </Card>
    </Page>
  );
}
