import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import enum

from app.db.base import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    member = "member"


class StatusEnum(str, enum.Enum):
    activo = "activo"
    inactivo = "inactivo"


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.member, nullable=False)
    parentesco = Column(String, nullable=True)
    estado = Column(Enum(StatusEnum), default=StatusEnum.activo, nullable=False)
    fecha_union = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
