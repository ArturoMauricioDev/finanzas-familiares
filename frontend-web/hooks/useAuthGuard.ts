"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearUnauthorizedHandler,
  refreshSession,
  setUnauthorizedHandler,
  validateSession,
} from "@/lib/api";
import { ApiError } from "@/lib/errors";
import {
  clearSession,
  clearStalePendingInvite,
  capturePendingInviteFromUrl,
  getPendingInviteCode,
  getSession,
  reconcileFamilyFlag,
  sessionNeedsRefresh,
  type SessionState,
} from "@/lib/session";

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
      // Captura el código de un enlace de invitación antes de decidir el
      // destino, para que sobreviva al login (FR-030).
      if (typeof window !== "undefined") {
        capturePendingInviteFromUrl(window.location.search);
      }

      let current = getSession();

      if (!current?.access_token) {
        redirect("/auth/login");
        return;
      }

      let validatedByRefresh = false;

      if (sessionNeedsRefresh(current)) {
        const refreshed = await refreshSession();
        if (!active) return;
        if (refreshed) {
          current = refreshed;
          validatedByRefresh = true;
        } else if (!getSession()) {
          // El refresh token ya no es válido: la sesión se limpió.
          redirect("/auth/login");
          return;
        } else {
          // Fallo transitorio de red: se conserva la sesión local como respaldo.
          current = reconcileFamilyFlag(current);
          validatedByRefresh = true;
        }
      } else {
        current = reconcileFamilyFlag(current);
      }

      // Validar la sesión contra el backend una vez por access token para
      // detectar usuarios/membresías inexistentes aunque el JWT siga vigente.
      if (!validatedByRefresh) {
        try {
          const validated = await validateSession();
          if (!active) return;
          if (validated) {
            current = validated;
          }
        } catch (error) {
          if (!active) return;
          if (error instanceof ApiError && error.status === 401) {
            clearSession();
            redirect("/auth/login");
            return;
          }
          // Error de red o 5xx: se usa el estado local como respaldo.
        }
      }

      clearStalePendingInvite(current);

      if (current.needs_profile_setup && pathname !== "/profile/setup") {
        redirect("/profile/setup");
        return;
      }

      const familySetupPath = getPendingInviteCode() ? "/invite" : "/family/select";

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

      if (!current.needs_family_setup && FAMILY_SETUP_PATHS.includes(pathname)) {
        redirect("/");
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
