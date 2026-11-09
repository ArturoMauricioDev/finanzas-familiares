import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { clearUnauthorizedHandler, refreshSession, setUnauthorizedHandler } from "../lib/api";
import {
  clearStalePendingInvite,
  getPendingInviteCode,
  getSession,
  reconcileFamilyFlag,
  sessionNeedsRefresh,
  type SessionState,
} from "../lib/session";

const FAMILY_SETUP_PATHS = ["/family/select", "/family/create", "/invite"];

export function useAuthGuard(requireFamily = false) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const handleUnauthorized = () => router.replace("/auth/login");
    setUnauthorizedHandler(handleUnauthorized);

    const redirect = (path: string) => {
      if (active) router.replace(path);
    };

    const resolveSession = async () => {
      let current = await getSession();

      if (!current?.access_token) {
        redirect("/auth/login");
        return;
      }

      if (sessionNeedsRefresh(current)) {
        const refreshed = await refreshSession();
        if (!active) return;
        if (!refreshed) {
          redirect("/auth/login");
          return;
        }
        current = refreshed;
      } else {
        current = await reconcileFamilyFlag(current);
      }

      await clearStalePendingInvite(current);

      if (current.needs_profile_setup && pathname !== "/profile/setup") {
        redirect("/profile/setup");
        return;
      }

      const familySetupPath = (await getPendingInviteCode()) ? "/invite" : "/family/select";

      if (
        !current.needs_profile_setup &&
        current.needs_family_setup &&
        !FAMILY_SETUP_PATHS.includes(pathname)
      ) {
        redirect(familySetupPath);
        return;
      }

      if (requireFamily && current.needs_family_setup) {
        redirect(familySetupPath);
        return;
      }

      setSession(current);
      setReady(true);
    };

    void resolveSession();

    return () => {
      active = false;
      clearUnauthorizedHandler(handleUnauthorized);
    };
  }, [pathname, requireFamily, router]);

  return { session, ready };
}
