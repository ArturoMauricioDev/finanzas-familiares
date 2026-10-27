from pydantic import BaseModel
from typing import Optional


class ProfileUpdateRequest(BaseModel):
    nombre_visualizacion: str
    foto_avatar: str


class UserResponse(BaseModel):
    id: str
    nombre_visualizacion: Optional[str] = None
    foto_avatar: Optional[str] = None
    family_id: Optional[str] = None
    role: Optional[str] = None
