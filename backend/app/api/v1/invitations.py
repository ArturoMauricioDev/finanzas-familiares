from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.schemas.invitation import (
    CreateInvitationRequest,
    InvitationResponse,
    JoinInvitationRequest,
    JoinInvitationResponse,
)
from app.services import invitation_service

router = APIRouter()


@router.post("/families/me/invitations", response_model=InvitationResponse, status_code=201)
def create_invitation(
    request: CreateInvitationRequest = CreateInvitationRequest(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return invitation_service.create_invitation(db, current_user["user_id"], request)


@router.post("/invitations/join", response_model=JoinInvitationResponse)
def join_invitation(
    request: JoinInvitationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return invitation_service.join_invitation(db, current_user["user_id"], request)
