from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateInvitationRequest(BaseModel):
    expira_en_horas: int = 72


class InvitationResponse(BaseModel):
    invitation_id: str
    token: str
    link: str
    expira_en: datetime


class JoinInvitationRequest(BaseModel):
    token: str
    parentesco: Optional[str] = None


class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class JoinInvitationResponse(BaseModel):
    family_id: str
    role: str
    estado: str
    tokens: TokensResponse
