from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.schemas.user import ProfileUpdateRequest, UserResponse
from app.services import user_service

router = APIRouter()


@router.put("/me/profile", response_model=UserResponse)
def update_profile(
    request: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return user_service.update_profile(db, current_user["user_id"], request)
