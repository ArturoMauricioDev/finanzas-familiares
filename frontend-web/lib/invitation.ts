import type { Invitation } from "./types";

export type InvitationStatus = "active" | "used" | "expired";

const dayInMs = 24 * 60 * 60 * 1000;

export function normalizeInvitationCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function formatInvitationCode(value: string): string {
  const normalized = normalizeInvitationCode(value);
  if (!normalized) return "";
  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}

export function invitationCode(invitation: Pick<Invitation, "codigo" | "token">): string {
  return invitation.codigo || invitation.token || "";
}

export function invitationDaysRemaining(expiresAt: string, now: number = Date.now()): number {
  const expires = new Date(expiresAt).getTime();
  if (!Number.isFinite(expires)) return 0;
  return Math.max(0, Math.ceil((expires - now) / dayInMs));
}

export function invitationStatus(
  invitation: Pick<Invitation, "usado" | "expira_en">,
  now: number = Date.now(),
): InvitationStatus {
  if (invitation.usado) return "used";
  return new Date(invitation.expira_en).getTime() <= now ? "expired" : "active";
}

export function invitationStatusKey(status: InvitationStatus): string {
  if (status === "used") return "family.invitationStatusUsed";
  if (status === "expired") return "family.invitationStatusExpired";
  return "family.invitationStatusActive";
}
