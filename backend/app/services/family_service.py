from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.models.family import Family
from app.models.membership import Membership, RoleEnum, StatusEnum
from app.models.user import User


def _active_membership(db: Session, user_id):
    return (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )


def create_family(db: Session, user_id, request):
    if _active_membership(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a family",
        )

    try:
        family = Family(
            nombre=request.nombre,
            moneda_local=request.moneda_local,
            creado_por=user_id,
        )
        db.add(family)
        db.flush()

        membership = Membership(
            user_id=user_id,
            family_id=family.id,
            role=RoleEnum.admin,
            estado=StatusEnum.activo,
        )
        db.add(membership)
        db.commit()
        db.refresh(family)
        db.refresh(membership)
    except Exception:
        db.rollback()
        raise

    token_data = {"user_id": str(user_id), "family_id": str(family.id), "role": "admin"}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    from app.schemas.family import (
        FamilyCreateResponse,
        FamilyResponse,
        MembershipInfo,
        TokensResponse,
    )

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


def get_family_detail(db: Session, user_id):
    membership = _active_membership(db, user_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to a family",
        )

    family = db.query(Family).filter(Family.id == membership.family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found",
        )

    rows = (
        db.query(Membership, User)
        .join(User, Membership.user_id == User.id)
        .filter(
            Membership.family_id == family.id,
            Membership.estado == StatusEnum.activo,
        )
        .all()
    )

    from app.schemas.family import FamilyDetailResponse, FamilyResponse, MemberInfo

    members = [
        MemberInfo(
            user_id=str(user.id),
            nombre_visualizacion=user.nombre_visualizacion,
            foto_avatar=user.foto_avatar,
            role=member.role.value,
            parentesco=member.parentesco,
            estado=member.estado.value,
        )
        for member, user in rows
    ]

    return FamilyDetailResponse(
        family=FamilyResponse(
            id=str(family.id),
            nombre=family.nombre,
            moneda_local=family.moneda_local,
            creado_por=str(family.creado_por),
            fecha_creacion=family.fecha_creacion,
        ),
        members=members,
        member_count=len(members),
    )


def _require_admin(db: Session, user_id):
    membership = _active_membership(db, user_id)
    if not membership or membership.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage members",
        )
    return membership


def promote_member(db: Session, admin_id, user_id):
    admin_membership = _require_admin(db, admin_id)

    target = (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.family_id == admin_membership.family_id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    target.role = RoleEnum.admin
    db.commit()
    db.refresh(target)
    return {"success": True, "role": target.role.value}


def remove_member(db: Session, admin_id, user_id):
    admin_membership = _require_admin(db, admin_id)

    if str(admin_id) == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot remove themselves",
        )

    target = (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.family_id == admin_membership.family_id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    if target.role == RoleEnum.admin:
        admin_count = (
            db.query(Membership)
            .filter(
                Membership.family_id == admin_membership.family_id,
                Membership.estado == StatusEnum.activo,
                Membership.role == RoleEnum.admin,
            )
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A family must keep at least one admin",
            )

    target.estado = StatusEnum.inactivo
    db.commit()
    return {"success": True}
