from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProfileUpdateRequest(BaseModel):
    nombre_visualizacion: str = Field(min_length=1, max_length=120)
    foto_avatar: str = Field(min_length=1, max_length=2048)

    @field_validator("nombre_visualizacion", "foto_avatar")
    @classmethod
    def validate_non_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El campo no puede estar vacío")
        return value


class UserResponse(BaseModel):
    id: str
    nombre_visualizacion: Optional[str] = None
    foto_avatar: Optional[str] = None
    family_id: Optional[str] = None
    role: Optional[str] = None
