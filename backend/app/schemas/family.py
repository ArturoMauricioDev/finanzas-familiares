from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CreateFamilyRequest(BaseModel):
    nombre: str
    moneda_local: str


class FamilyResponse(BaseModel):
    id: str
    nombre: str
    moneda_local: str
    creado_por: str
    fecha_creacion: datetime


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
    parentesco: Optional[str] = None
    estado: str


class FamilyDetailResponse(BaseModel):
    family: FamilyResponse
    members: List[MemberInfo]
    member_count: int
