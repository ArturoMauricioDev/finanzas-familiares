from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import secrets

from app.models.invitation import Invitation
from app.models.membership import Membership, RoleEnum, StatusEnum
from app.models.family import Family
from app.core.security import create_access_token, create_refresh_token


def create_invitation(db: Session, user_id: str, request):
    # Check if admin
    membership = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if not membership or membership.role != RoleEnum.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can create invitations")

    token = secrets.token_urlsafe(32)
    expira_en = datetime.utcnow() + timedelta(hours=request.expira_en_horas)

    invitation = Invitation(
        family_id=membership.family_id,
        token=token,
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
        token=token,
        link=f"https://app/invite?token={token}",
        expira_en=invitation.expira_en,
    )


def join_invitation(db: Session, user_id: str, request):
    # Check if user already has active membership
    existing = db.query(Membership).filter(
        Membership.user_id == user_id,
        Membership.estado == StatusEnum.activo
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already belongs to a family")

    invitation = db.query(Invitation).filter(Invitation.token == request.token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid invitation token")

    if invitation.usado:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already used")

    if invitation.expira_en < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation expired")

    # Check member count
    member_count = db.query(Membership).filter(
        Membership.family_id == invitation.family_id,
        Membership.estado == StatusEnum.activo
    ).count()
    if member_count >= 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Family has reached maximum member limit")

    # Create membership
    membership = Membership(
        user_id=user_id,
        family_id=invitation.family_id,
        role=RoleEnum.member,
        parentesco=request.parentesco,
        estado=StatusEnum.activo,
    )
    db.add(membership)

    # Mark invitation as used
    invitation.usado = True
    db.commit()
    db.refresh(membership)

    # Generate tokens
    token_data = {"user_id": str(user_id), "family_id": str(invitation.family_id), "role": "member"}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    from app.schemas.invitation import JoinInvitationResponse, TokensResponse
    return JoinInvitationResponse(
        family_id=str(invitation.family_id),
        role="member",
        estado="activo",
        tokens=TokensResponse(access_token=access_token, refresh_token=refresh_token),
    )
