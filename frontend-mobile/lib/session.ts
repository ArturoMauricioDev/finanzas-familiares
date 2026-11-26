import * as storage from "./storage";

import type {
  FamilyCreateResponse,
  FamilyLifecycleResponse,
  JoinInvitationResponse,
  TokenResponse,
  UserAuthInfo,
} from "./types";

export interface SessionState {
  access_token: string;
  refresh_token: string;
  user: UserAuthInfo;
  needs_profile_setup: boolean;
  needs_family_setup: boolean;
}

const SESSION_KEY = "finanzas_familiares_session";
const PENDING_INVITE_KEY = "finanzas_familiares_pending_invite";

export async function getSession(): Promise<SessionState | null> {
  try {
    const raw = await storage.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

export async function saveSession(session: SessionState): Promise<void> {
  await storage.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function updateSession(patch: Partial<SessionState>): Promise<SessionState | null> {
  const current = await getSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  await saveSession(next);
  return next;
}

export async function clearSession(): Promise<void> {
  await storage.deleteItemAsync(SESSION_KEY);
}

export async function savePendingInviteCode(code: string): Promise<void> {
  if (!code) return;
  await storage.setItemAsync(PENDING_INVITE_KEY, code);
}

export async function getPendingInviteCode(): Promise<string | null> {
  try {
    return await storage.getItemAsync(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

export async function clearPendingInviteCode(): Promise<void> {
  await storage.deleteItemAsync(PENDING_INVITE_KEY);
}

/**
 * Extrae el código de un enlace de invitación (`...?codigo=`/`?code=`/`?token=`).
 */
export function parseInviteCodeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?&](?:codigo|code|token)=([^&#]+)/i);
  if (!match) return null;
  let raw = match[1];
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // conserva el valor tal cual si no es un URI válido
  }
  const normalized = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return normalized || null;
}

/**
 * Guarda como pendiente el código de un enlace de invitación antes del login,
 * para que tras autenticarse la persona llegue directo a "Unirme" (FR-030).
 */
export async function capturePendingInviteFromUrl(
  url: string | null | undefined,
): Promise<string | null> {
  const code = parseInviteCodeFromUrl(url);
  if (code) {
    await savePendingInviteCode(code);
  }
  return code;
}

export const savePendingInviteToken = savePendingInviteCode;
export const getPendingInviteToken = getPendingInviteCode;
export const clearPendingInviteToken = clearPendingInviteCode;

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function decodeBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of normalized) {
    if (char === "=") continue;
    const index = BASE64_ALPHABET.indexOf(char);
    if (index === -1) return null;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

export function getTokenExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;

  try {
    const data = JSON.parse(decoded) as { exp?: unknown };
    return typeof data.exp === "number" && Number.isFinite(data.exp) ? data.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function sessionNeedsRefresh(session: SessionState | null, now = Date.now()): boolean {
  if (!session) return false;
  if (!session.user?.id) return true;
  if (
    typeof session.needs_profile_setup !== "boolean" ||
    typeof session.needs_family_setup !== "boolean"
  ) {
    return true;
  }

  const expiresAt = getTokenExpiry(session.access_token);
  return expiresAt !== null && expiresAt <= now;
}

export async function reconcileFamilyFlag(session: SessionState): Promise<SessionState> {
  const needsFamilySetup = !session.user?.family_id;
  if (session.needs_family_setup === needsFamilySetup) return session;

  const next = { ...session, needs_family_setup: needsFamilySetup };
  await saveSession(next);
  return next;
}

export async function clearStalePendingInvite(session: SessionState): Promise<void> {
  if (session.user?.family_id && !session.needs_family_setup) {
    await clearPendingInviteToken();
  }
}

export async function applyTokenResponse(data: TokenResponse): Promise<SessionState> {
  const session: SessionState = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user: data.user,
    needs_profile_setup: data.needs_profile_setup,
    needs_family_setup: data.needs_family_setup,
  };
  await saveSession(session);
  await clearStalePendingInvite(session);
  return session;
}

export async function applyFamilyCreated(data: FamilyCreateResponse): Promise<SessionState | null> {
  const current = await getSession();
  if (!current) return null;
  const next: SessionState = {
    ...current,
    access_token: data.tokens.access_token,
    refresh_token: data.tokens.refresh_token,
    user: {
      ...current.user,
      family_id: data.family.id,
      role: data.membership.role,
    },
    needs_family_setup: false,
  };
  await saveSession(next);
  return next;
}

export async function applyInvitationJoined(
  data: JoinInvitationResponse,
): Promise<SessionState | null> {
  const current = await getSession();
  if (!current) return null;
  const next: SessionState = {
    ...current,
    access_token: data.tokens.access_token,
    refresh_token: data.tokens.refresh_token,
    user: {
      ...current.user,
      family_id: data.family_id,
      role: data.role,
    },
    needs_family_setup: false,
  };
  await saveSession(next);
  return next;
}

export async function applyFamilyLeft(
  data?: FamilyLifecycleResponse,
): Promise<SessionState | null> {
  const current = await getSession();
  if (!current) return null;
  const next: SessionState = {
    ...current,
    access_token: data?.tokens?.access_token ?? current.access_token,
    refresh_token: data?.tokens?.refresh_token ?? current.refresh_token,
    user: {
      ...current.user,
      family_id: null,
      role: null,
    },
    needs_family_setup: true,
  };
  await saveSession(next);
  await clearPendingInviteCode();
  return next;
}
