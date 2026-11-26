import { expect, type APIRequestContext } from "@playwright/test";

import { API_URL, type SessionState } from "./seed";

const API = `${API_URL}/api/v1`;

function authHeaders(session: SessionState) {
  return { Authorization: `Bearer ${session.access_token}` };
}

export interface FamilyRecord {
  id: string;
  nombre: string;
  moneda_local: string;
}

/**
 * Las factorías hablan con el backend real. El seed solo aporta identidades:
 * cada prueba crea sus propias familias e invitaciones para que los códigos de
 * un solo uso y los borrados no se contaminen entre pruebas.
 */
export async function createFamilyViaApi(
  request: APIRequestContext,
  session: SessionState,
  overrides: {
    nombre?: string;
    moneda_local?: string;
    rol_familiar?: "padre" | "madre";
  } = {},
): Promise<{ session: SessionState; family: FamilyRecord }> {
  const response = await request.post(`${API}/families`, {
    headers: authHeaders(session),
    data: {
      nombre: overrides.nombre ?? "Familia Prueba",
      moneda_local: overrides.moneda_local ?? "EUR",
      rol_familiar: overrides.rol_familiar ?? "padre",
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const body = await response.json();

  return {
    family: body.family as FamilyRecord,
    session: {
      ...session,
      access_token: body.tokens.access_token,
      refresh_token: body.tokens.refresh_token,
      user: { ...session.user, family_id: body.family.id, role: body.membership.role },
      needs_family_setup: false,
    },
  };
}

export async function createInvitationViaApi(
  request: APIRequestContext,
  session: SessionState,
  payload: { rol_familiar: string; parentesco?: string },
): Promise<{ codigo: string; rol_familiar: string | null; parentesco: string | null }> {
  const response = await request.post(`${API}/families/me/invitations`, {
    headers: authHeaders(session),
    data: payload,
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

export async function joinWithCodeViaApi(
  request: APIRequestContext,
  session: SessionState,
  codigo: string,
): Promise<SessionState> {
  const response = await request.post(`${API}/invitations/join`, {
    headers: authHeaders(session),
    data: { codigo },
  });
  expect(response.status(), await response.text()).toBe(200);
  const body = await response.json();
  return {
    ...session,
    access_token: body.tokens.access_token,
    refresh_token: body.tokens.refresh_token,
    user: { ...session.user, family_id: body.family_id, role: body.role },
    needs_family_setup: false,
  };
}

export interface FamilyDetailBody {
  family: FamilyRecord;
  members: Array<{
    user_id: string;
    role?: string;
    rol_permiso?: string;
    rol_familiar?: string | null;
  }>;
  member_count: number;
}

export async function fetchFamilyViaApi(
  request: APIRequestContext,
  session: SessionState,
): Promise<{ status: number; body: FamilyDetailBody | null }> {
  const response = await request.get(`${API}/families/me`, { headers: authHeaders(session) });
  const status = response.status();
  const body = status === 200 ? ((await response.json()) as FamilyDetailBody) : null;
  return { status, body };
}
