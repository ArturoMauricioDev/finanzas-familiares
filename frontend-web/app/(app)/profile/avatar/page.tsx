"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import {
  AvatarEditor,
  Button,
  Card,
  ConfirmDialog,
  Loading,
  Page,
} from "@/components/ui";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function ProfileAvatarPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { session, ready } = useAuthGuard(true);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const leave = () => router.push("/profile");
  const requestBack = () => {
    if (dirty) {
      setConfirmLeave(true);
      return;
    }
    leave();
  };

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  if (!ready || !session) return <Loading />;

  return (
    <Page
      title={t("avatar.title")}
      subtitle={t("avatar.subtitle")}
      actions={
        <Button variant="secondary" onClick={requestBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          {t("profile.backToProfile")}
        </Button>
      }
    >
      <Card variant="elevated">
        <AvatarEditor
          seed={session.user.email || session.user.id}
          onDirtyChange={setDirty}
        />
      </Card>

      <ConfirmDialog
        open={confirmLeave}
        title={t("avatar.discardTitle")}
        description={t("avatar.discardBody")}
        confirmLabel={t("avatar.discard")}
        cancelLabel={t("common.cancel")}
        destructive
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          leave();
        }}
      />
    </Page>
  );
}