export interface UserAuthInfo {
  id: string;
  email: string;
  nombre_visualizacion: string | null;
  foto_avatar: string | null;
  family_id: string | null;
  role: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserAuthInfo;
  needs_profile_setup: boolean;
  needs_family_setup: boolean;
}

export interface UserResponse {
  id: string;
  nombre_visualizacion: string | null;
  foto_avatar: string | null;
  family_id: string | null;
  role: string | null;
}

export interface Family {
  id: string;
  nombre: string;
  moneda_local: string;
  creado_por: string;
  fecha_creacion: string;
}

export interface Member {
  user_id: string;
  nombre_visualizacion: string | null;
  foto_avatar: string | null;
  role: string;
  parentesco: string | null;
  estado: string;
}

export interface FamilyDetail {
  family: Family;
  members: Member[];
  member_count: number;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface FamilyCreateResponse {
  family: Family;
  membership: { role: string; estado: string };
  tokens: Tokens;
}

export interface Invitation {
  invitation_id: string;
  token: string;
  link: string;
  expira_en: string;
}

export interface JoinInvitationResponse {
  family_id: string;
  role: string;
  estado: string;
  tokens: Tokens;
}
