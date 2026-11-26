from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.schemas.auth import (
    GoogleTokenRequest,
    RefreshTokenRequest,
    SessionResponse,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter()


@router.get("/session", response_model=SessionResponse)
def read_session(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Valida la sesión vigente y devuelve el estado del usuario sin rotar tokens.

    Rechaza con 401 si el usuario ya no existe, de modo que el cliente limpie la
    sesión persistida en lugar de quedar atrapado en el ciclo de familia.
    """
    result = auth_service.session_info(db, current_user["user_id"])
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists"
        )
    return result


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
