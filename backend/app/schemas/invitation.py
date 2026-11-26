from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.models.membership import FamilyRoleEnum


class CreateInvitationRequest(BaseModel):
    rol_familiar: FamilyRoleEnum
    parentesco: Optional[str] = Field(default=None, max_length=80)

    @model_validator(mode="after")
    def validate_kinship(self) -> "CreateInvitationRequest":
        provided = self.parentesco is not None
        parentesco = (self.parentesco or "").strip()
        if self.rol_familiar == FamilyRoleEnum.otro:
            if not parentesco:
                raise ValueError("parentesco es obligatorio cuando el rol es otro")
            self.parentesco = parentesco
        else:
            if provided:
                raise ValueError("parentesco solo aplica cuando el rol es otro")
            self.parentesco = None
        return self


class InvitationResponse(BaseModel):
    invitation_id: str
    codigo: str
    rol_familiar: Optional[FamilyRoleEnum] = None
    parentesco: Optional[str] = None
    expira_en: datetime
    usado: bool


class JoinInvitationRequest(BaseModel):
    codigo: Optional[str] = Field(default=None, min_length=1, max_length=32)
    token: Optional[str] = Field(default=None, min_length=1)

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
    rol_familiar: Optional[FamilyRoleEnum] = None
    estado: str
    tokens: TokensResponse