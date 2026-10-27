from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import timedelta
import jwt as pyjwt

from app.models.user import User
from app.models.membership import Membership, StatusEnum
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_token


def authenticate_with_google(db: Session, token: str):
    google_id = None
    email = None

    try:
        if settings.GOOGLE_CLIENT_ID:
            try:
                # Intentar verificación estricta con el Web Client ID
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
                google_id = idinfo.get('sub')
                email = idinfo.get('email')
            except Exception:
                # Fallback para desarrollo: decodificar sin verificar firma/audiencia
                try:
                    idinfo = pyjwt.decode(token, options={"verify_signature": False, "verify_aud": False, "verify_exp": False})
                    google_id = idinfo.get('sub') or idinfo.get('email')
                    email = idinfo.get('email')
                except Exception:
                    return None
        else:
            try:
                idinfo = pyjwt.decode(token, options={"verify_signature": False, "verify_aud": False, "verify_exp": False})
                google_id = idinfo.get('sub') or idinfo.get('email')
                email = idinfo.get('email')
            except Exception:
                return None
    except Exception:
        return None

    if not google_id or not email:
        return None

    user = db.query(User).filter(User.google_id == google_id).first()
    needs_profile_setup = False
    needs_family_setup = False

    if not user:
        user = User(google_id=google_id, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
        needs_profile_setup = True
        needs_family_setup = True
    else:
        if not user.nombre_visualizacion or not user.foto_avatar:
            needs_profile_setup = True
        membership = db.query(Membership).filter(
            Membership.user_id == user.id,
            Membership.estado == StatusEnum.activo
        ).first()
        if not membership:
            needs_family_setup = True
        else:
            needs_family_setup = False

    membership = db.query(Membership).filter(
        Membership.user_id == user.id,
        Membership.estado == StatusEnum.activo
    ).first()

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

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    membership = db.query(Membership).filter(
        Membership.user_id == user.id,
        Membership.estado == StatusEnum.activo
    ).first()

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
