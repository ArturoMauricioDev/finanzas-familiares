import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class FamilyStatusEnum(str, enum.Enum):
    activo = "activo"
    eliminado = "eliminado"


class Family(Base):
    __tablename__ = "families"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    moneda_local = Column(String(3), nullable=False)
    creado_por = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    estado = Column(Enum(FamilyStatusEnum), default=FamilyStatusEnum.activo, nullable=False)
    fecha_eliminacion = Column(DateTime(timezone=True), nullable=True)
