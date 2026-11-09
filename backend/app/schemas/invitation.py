from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class CreateInvitationRequest(BaseModel):
    expira_en_horas: int = Field(default=168, ge=1, le=720)


class InvitationResponse(BaseModel):
    invitation_id: str
    codigo: str
    expira_en: datetime
    usado: bool


class JoinInvitationRequest(BaseModel):
    codigo: Optional[str] = Field(default=None, min_length=1, max_length=32)
    token: Optional[str] = Field(default=None, min_length=1)
    parentesco: Optional[str] = Field(default=None, max_length=80)

    @model_validator(mode="after")
    def require_code_or_token(self) -> "JoinInvitationRequest":
        if not self.codigo and not self.token:
            raise ValueError("codigo es obligatorio")
        return self


class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class JoinInvitationResponse(BaseModel):
    family_id: str
    role: str
    estado: str
    tokens: TokensResponse
