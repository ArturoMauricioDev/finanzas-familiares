from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateInvitationRequest(BaseModel):
    expira_en_horas: int = Field(default=72, ge=1, le=720)


class InvitationResponse(BaseModel):
    invitation_id: str
    token: str
    link: str
    expira_en: datetime


class JoinInvitationRequest(BaseModel):
    token: str = Field(min_length=1)
    parentesco: Optional[str] = Field(default=None, max_length=80)


class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class JoinInvitationResponse(BaseModel):
    family_id: str
    role: str
    estado: str
    tokens: TokensResponse
