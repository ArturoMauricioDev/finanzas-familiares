import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class UserStatusEnum(str, enum.Enum):
    activo = "activo"
    eliminado = "eliminado"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    nombre_visualizacion = Column(String, nullable=True)
    foto_avatar = Column(String, nullable=True)
    estado = Column(Enum(UserStatusEnum), default=UserStatusEnum.activo, nullable=False)
    fecha_eliminacion = Column(DateTime(timezone=True), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
