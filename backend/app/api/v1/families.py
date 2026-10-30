from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.schemas.family import CreateFamilyRequest, FamilyCreateResponse, FamilyDetailResponse
from app.services import family_service

router = APIRouter()


@router.post("", response_model=FamilyCreateResponse, status_code=201)
def create_family(
    request: CreateFamilyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return family_service.create_family(db, current_user["user_id"], request)


@router.get("/me", response_model=FamilyDetailResponse)
def get_my_family(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return family_service.get_family_detail(db, current_user["user_id"])


@router.post("/me/members/{user_id}/promote")
def promote_member(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return family_service.promote_member(db, current_user["user_id"], user_id)


@router.delete("/me/members/{user_id}")
def remove_member(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return family_service.remove_member(db, current_user["user_id"], user_id)
