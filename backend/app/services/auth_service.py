import uuid

from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.models.membership import Membership, StatusEnum
from app.models.user import User


def _google_audiences():
    audiences = []
    for value in (settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_IDS):
        if value:
            audiences.extend(part.strip() for part in value.split(",") if part.strip())
    return list(dict.fromkeys(audiences))


def _verify_google_token(token: str):
    audiences = _google_audiences()
    if not audiences:
        return None

    for audience in audiences:
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                audience,
            )
        except Exception:
            continue

        google_id = idinfo.get("sub")
        email = idinfo.get("email")
        if not google_id or not email:
            return None

        return {"google_id": google_id, "email": email}

    return None


def _active_membership(db: Session, user_id):
    return (
        db.query(Membership)
        .filter(
            Membership.user_id == user_id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )


def authenticate_with_google(db: Session, token: str):
    google_data = _verify_google_token(token)
    if not google_data:
        return None

    user = db.query(User).filter(User.google_id == google_data["google_id"]).first()

    if not user:
        user = User(google_id=google_data["google_id"], email=google_data["email"])
        db.add(user)
        db.commit()
        db.refresh(user)

    membership = _active_membership(db, user.id)
    needs_profile_setup = not (user.nombre_visualizacion and user.foto_avatar)
    needs_family_setup = membership is None

    family_id = str(membership.family_id) if membership else None
    role = membership.role.value if membership else None

    token_data = {"user_id": str(user.id), "family_id": family_id, "role": role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    from app.schemas.auth import TokenResponse, UserAuthInfo

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserAuthInfo(
            id=str(user.id),
            email=user.email,
            nombre_visualizacion=user.nombre_visualizacion,
            foto_avatar=user.foto_avatar,
            family_id=family_id,
            role=role,
        ),
        needs_profile_setup=needs_profile_setup,
        needs_family_setup=needs_family_setup,
    )


def refresh_tokens(db: Session, refresh_token: str):
    payload = verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        return None

    try:
        user_id = uuid.UUID(str(payload.get("user_id")))
    except (ValueError, TypeError, AttributeError):
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    membership = _active_membership(db, user.id)
    family_id = str(membership.family_id) if membership else None
    role = membership.role.value if membership else None

    token_data = {"user_id": str(user.id), "family_id": family_id, "role": role}
    access_token = create_access_token(token_data)
    refresh_token_new = create_refresh_token(token_data)

    from app.schemas.auth import TokenResponse, UserAuthInfo

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_new,
        token_type="bearer",
        user=UserAuthInfo(
            id=str(user.id),
            email=user.email,
            nombre_visualizacion=user.nombre_visualizacion,
            foto_avatar=user.foto_avatar,
            family_id=family_id,
            role=role,
        ),
        needs_profile_setup=not (user.nombre_visualizacion and user.foto_avatar),
        needs_family_setup=membership is None,
    )
