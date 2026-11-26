from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.family import Family, FamilyStatusEnum
from app.models.membership import Membership, StatusEnum
from app.models.user import User, UserStatusEnum
from app.schemas.user import ProfileUpdateRequest, UserResponse
from app.services.family_service import _reassign_admin_if_needed


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def update_profile(db: Session, user_id: str, request: ProfileUpdateRequest):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.estado != UserStatusEnum.activo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.nombre_visualizacion = request.nombre_visualizacion
    user.foto_avatar = request.foto_avatar
    db.commit()
    db.refresh(user)

    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.estado == StatusEnum.activo)
        .first()
    )

    return UserResponse(
        id=str(user.id),
        nombre_visualizacion=user.nombre_visualizacion,
        foto_avatar=user.foto_avatar,
        family_id=str(membership.family_id) if membership else None,
        role=membership.role.value if membership else None,
    )


def delete_account(db: Session, user_id: str) -> None:
    """Desactiva la cuenta sin borrar la fila (soft delete).

    - Si la persona es el único integrante activo, la familia se marca como
      eliminada para no dejar un grupo vacío.
    - Si hay más integrantes, su membresía pasa a inactiva y, de ser necesario,
      se reasigna el rol de administrador.
    - La fila se conserva con ``estado = eliminado`` para no romper las claves
      foráneas; el acceso queda bloqueado en autenticación y sesión.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.estado == UserStatusEnum.eliminado:
        return

    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == user.id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )

    if membership:
        family = (
            db.query(Family)
            .filter(Family.id == membership.family_id)
            .with_for_update()
            .first()
        )
        if family and family.estado == FamilyStatusEnum.activo:
            active_count = (
                db.query(Membership)
                .filter(
                    Membership.family_id == family.id,
                    Membership.estado == StatusEnum.activo,
                )
                .count()
            )
            membership.estado = StatusEnum.inactivo
            if active_count <= 1:
                family.estado = FamilyStatusEnum.eliminado
                family.fecha_eliminacion = _utcnow()
            else:
                db.flush()
                _reassign_admin_if_needed(db, family.id)
        else:
            membership.estado = StatusEnum.inactivo

    user.estado = UserStatusEnum.eliminado
    user.fecha_eliminacion = _utcnow()
    db.commit()
