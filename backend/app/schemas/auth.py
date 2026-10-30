from typing import Optional

from pydantic import BaseModel


class GoogleTokenRequest(BaseModel):
    id_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserAuthInfo(BaseModel):
    id: str
    email: str
    nombre_visualizacion: Optional[str] = None
    foto_avatar: Optional[str] = None
    family_id: Optional[str] = None
    role: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserAuthInfo
    needs_profile_setup: bool = False
    needs_family_setup: bool = False
