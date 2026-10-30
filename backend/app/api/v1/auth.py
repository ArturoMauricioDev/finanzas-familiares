from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.auth import GoogleTokenRequest, RefreshTokenRequest, TokenResponse
from app.services import auth_service

router = APIRouter()


@router.post("/google", response_model=TokenResponse)
def google_auth(request: GoogleTokenRequest, db: Session = Depends(get_db)):
    result = auth_service.authenticate_with_google(db, request.id_token)
    if not result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")
    return result


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    result = auth_service.refresh_tokens(db, request.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    return result
