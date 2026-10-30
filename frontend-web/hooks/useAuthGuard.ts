"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession, type SessionState } from "@/lib/session";

const FAMILY_SETUP_PATHS = ["/family/select", "/family/create", "/invite"];

export function useAuthGuard(requireFamily = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getSession();

    if (!current?.access_token) {
      router.replace("/auth/login");
      return;
    }

    if (current.needs_profile_setup && pathname !== "/profile/setup") {
      router.replace("/profile/setup");
      return;
    }

    if (
      !current.needs_profile_setup &&
      current.needs_family_setup &&
      !FAMILY_SETUP_PATHS.includes(pathname)
    ) {
      router.replace("/family/select");
      return;
    }

    if (requireFamily && current.needs_family_setup) {
      router.replace("/family/select");
      return;
    }

    setSession(current);
    setReady(true);
  }, [pathname, requireFamily, router]);

  return { session, ready };
}
