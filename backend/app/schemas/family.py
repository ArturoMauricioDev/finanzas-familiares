from datetime import datetime
from typing import List, Optional

import pycountry
from pydantic import BaseModel, Field, field_validator


class CreateFamilyRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    moneda_local: str = Field(min_length=3, max_length=3)

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("nombre no puede estar vacío")
        return value

    @field_validator("moneda_local")
    @classmethod
    def validate_moneda_local(cls, value: str) -> str:
        value = value.strip().upper()
        if pycountry.currencies.get(alpha_3=value) is None:
            raise ValueError("moneda_local debe ser un código ISO 4217 de 3 letras")
        return value


class FamilyResponse(BaseModel):
    id: str
    nombre: str
    moneda_local: str
    creado_por: str
    fecha_creacion: datetime
    estado: str = "activo"


class TokensResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MembershipInfo(BaseModel):
    role: str
    estado: str


class FamilyCreateResponse(BaseModel):
    family: FamilyResponse
    membership: MembershipInfo
    tokens: TokensResponse


class MemberInfo(BaseModel):
    user_id: str
    nombre_visualizacion: Optional[str] = None
    foto_avatar: Optional[str] = None
    role: str
    rol_familiar: Optional[str] = None
    rol_permiso: str
    parentesco: Optional[str] = None
    estado: str
    created_at: Optional[datetime] = None


class FamilyDetailResponse(BaseModel):
    family: FamilyResponse
    members: List[MemberInfo]
    member_count: int


class FamilyLifecycleResponse(BaseModel):
    success: bool
    family_id: Optional[str] = None
    tokens: Optional[TokensResponse] = None
