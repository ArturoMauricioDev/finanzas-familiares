import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.models.family import Family, FamilyStatusEnum
from app.models.invitation import Invitation
from app.models.membership import Membership, RoleEnum, StatusEnum

INVITATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
INVITATION_CODE_LENGTH = 8
INVITATION_EXPIRY_DAYS = 7


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _generate_invitation_code(db: Session) -> str:
    for _ in range(10):
        code = "".join(
            secrets.choice(INVITATION_CODE_ALPHABET) for _ in range(INVITATION_CODE_LENGTH)
        )
        exists = db.query(Invitation).filter(Invitation.codigo == code).first()
        if not exists:
            return code
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate invitation code",
    )


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _active_membership(db: Session, user_id):
    return (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )


def create_invitation(db: Session, user_id, request):
    membership = _active_membership(db, user_id)
    if not membership or membership.role != RoleEnum.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create invitations",
        )

    family = db.query(Family).filter(Family.id == membership.family_id).first()
    if not family or family.estado != FamilyStatusEnum.activo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found",
        )

    codigo = _generate_invitation_code(db)
    expira_en = _utcnow() + timedelta(days=INVITATION_EXPIRY_DAYS)

    invitation = Invitation(
        family_id=membership.family_id,
        codigo=codigo,
        token=None,
        generado_por=user_id,
        expira_en=expira_en,
        usado=False,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    from app.schemas.invitation import InvitationResponse

    return InvitationResponse(
        invitation_id=str(invitation.id),
        codigo=codigo,
        expira_en=invitation.expira_en,
        usado=False,
    )


def join_invitation(db: Session, user_id, request):
    if _active_membership(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a family",
        )

    code = (request.codigo or request.token or "").strip().upper()
    invitation = db.query(Invitation).filter(Invitation.codigo == code).with_for_update().first()
    if not invitation and request.token:
        invitation = (
            db.query(Invitation).filter(Invitation.token == request.token).with_for_update().first()
        )
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation code",
        )

    if invitation.usado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation code already used",
        )

    if _ensure_utc(invitation.expira_en) < _utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation code expired",
        )

    family = db.query(Family).filter(Family.id == invitation.family_id).with_for_update().first()
    if not family or family.estado != FamilyStatusEnum.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation family not found",
        )

    member_count = (
        db.query(Membership)
        .filter(
            Membership.family_id == invitation.family_id,
            Membership.estado == StatusEnum.activo,
        )
        .count()
    )
    if member_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Family has reached maximum member limit",
        )

    try:
        membership = Membership(
            user_id=user_id,
            family_id=invitation.family_id,
            role=RoleEnum.member,
            parentesco=request.parentesco,
            estado=StatusEnum.activo,
        )
        db.add(membership)
        invitation.usado = True
        invitation.fecha_uso = _utcnow()
        db.commit()
        db.refresh(membership)
    except IntegrityError:
        db.rollback()
        if _active_membership(db, user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already belongs to a family",
            ) from None
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invitation could not be completed due to a conflict",
        ) from None
    except Exception:
        db.rollback()
        raise

    token_data = {
        "user_id": str(user_id),
        "family_id": str(invitation.family_id),
        "role": "member",
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    from app.schemas.invitation import JoinInvitationResponse, TokensResponse

    return JoinInvitationResponse(
        family_id=str(invitation.family_id),
        role="member",
        estado="activo",
        tokens=TokensResponse(access_token=access_token, refresh_token=refresh_token),
    )
