from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import ProfileUpdateRequest, UserResponse


def update_profile(db: Session, user_id: str, request: ProfileUpdateRequest):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.nombre_visualizacion = request.nombre_visualizacion
    user.foto_avatar = request.foto_avatar
    db.commit()
    db.refresh(user)

    from app.models.membership import Membership, StatusEnum

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
