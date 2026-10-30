import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    member = "member"


class StatusEnum(str, enum.Enum):
    activo = "activo"
    inactivo = "inactivo"


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        Index(
            "uq_memberships_active_user",
            "user_id",
            unique=True,
            postgresql_where=text("estado = 'activo'"),
            sqlite_where=text("estado = 'activo'"),
        ),
        Index("ix_memberships_family_estado", "family_id", "estado"),
        Index("ix_memberships_user_estado", "user_id", "estado"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    family_id = Column(UUID(as_uuid=True), ForeignKey("families.id"), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.member, nullable=False)
    parentesco = Column(String, nullable=True)
    estado = Column(Enum(StatusEnum), default=StatusEnum.activo, nullable=False)
    fecha_union = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
