"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useI18n } from "@/components/providers/LocaleProvider";
import { Loading, Page } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    router.replace("/family/members");
  }, [router]);

  return (
    <Page title={t("nav.home")}>
      <Loading message={t("common.redirecting")} />
    </Page>
  );
}
