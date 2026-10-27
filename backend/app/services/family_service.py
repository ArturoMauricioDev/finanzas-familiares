from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from app.models.family import Family
from app.models.user import User
from app.models.membership import Membership, RoleEnum, StatusEnum
from app.core.security import create_access_token, create_refresh_token


def create_family(db: Session, user_id: str, request):
    # Check if user already has active membership
    existing = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already belongs to a family")

    # Create family
    family = Family(
        nombre=request.nombre,
        moneda_local=request.moneda_local,
        creado_por=user_id,
    )
    db.add(family)
    db.commit()
    db.refresh(family)

    # Create membership as admin
    membership = Membership(
        user_id=user_id,
        family_id=family.id,
        role=RoleEnum.admin,
        estado=StatusEnum.activo,
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)

    # Generate new tokens with family info
    token_data = {"user_id": str(user_id), "family_id": str(family.id), "role": "admin"}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    from app.schemas.family import FamilyCreateResponse, FamilyResponse, MembershipInfo, TokensResponse
    return FamilyCreateResponse(
        family=FamilyResponse(
            id=str(family.id),
            nombre=family.nombre,
            moneda_local=family.moneda_local,
            creado_por=str(family.creado_por),
            fecha_creacion=family.fecha_creacion,
        ),
        membership=MembershipInfo(role="admin", estado="activo"),
        tokens=TokensResponse(access_token=access_token, refresh_token=refresh_token),
    )


def get_family_detail(db: Session, user_id: str):
    membership = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not belong to a family")

    family = db.query(Family).filter(Family.id == membership.family_id).first()
    members = db.query(Membership, User).join(User, Membership.user_id == User.id).filter(
        Membership.family_id == family.id,
        Membership.estado == StatusEnum.activo
    ).all()

    from app.schemas.family import FamilyDetailResponse, FamilyResponse, MemberInfo
    member_list = []
    for m, u in members:
        member_list.append(MemberInfo(
            user_id=str(u.id),
            nombre_visualizacion=u.nombre_visualizacion,
            foto_avatar=u.foto_avatar,
            role=m.role.value,
            parentesco=m.parentesco,
            estado=m.estado.value,
        ))

    return FamilyDetailResponse(
        family=FamilyResponse(
            id=str(family.id),
            nombre=family.nombre,
            moneda_local=family.moneda_local,
            creado_por=str(family.creado_por),
            fecha_creacion=family.fecha_creacion,
        ),
        members=member_list,
        member_count=len(member_list),
    )


def promote_member(db: Session, admin_id: str, user_id: str):
    # Check if admin
    admin_membership = db.query(Membership).filter(
        Membership.user_id == admin_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if not admin_membership or admin_membership.role != RoleEnum.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can promote members")

    # Get target membership
    target = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.family_id == admin_membership.family_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    target.role = RoleEnum.admin
    db.commit()
    return {"success": True}


def remove_member(db: Session, admin_id: str, user_id: str):
    admin_membership = db.query(Membership).filter(
        Membership.user_id == admin_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if not admin_membership or admin_membership.role != RoleEnum.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can remove members")

    target = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.family_id == admin_membership.family_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    target.estado = StatusEnum.inactivo
    db.commit()
    return {"success": True}
