import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.models.family import Family
from app.models.invitation import Invitation
from app.models.membership import Membership, RoleEnum, StatusEnum
from app.models.user import User
from app.schemas.invitation import CreateInvitationRequest, JoinInvitationRequest
from app.services import invitation_service

POSTGRES_URL = os.getenv("TEST_POSTGRES_URL")

pytestmark = pytest.mark.skipif(
    not POSTGRES_URL,
    reason="Set TEST_POSTGRES_URL to run the PostgreSQL regression tests",
)


@pytest.fixture
def pg_db():
    if "test" not in POSTGRES_URL:
        pytest.skip("TEST_POSTGRES_URL must point to a disposable test database")

    engine = create_engine(POSTGRES_URL)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def _create_user(db, email):
    user = User(
        google_id=f"google-{email}",
        email=email,
        nombre_visualizacion="Usuario",
        foto_avatar="https://example.com/avatar.png",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_admin_family(db, email="admin@example.com"):
    admin = _create_user(db, email)
    family = Family(nombre="Familia Test", moneda_local="MXN", creado_por=admin.id)
    db.add(family)
    db.flush()
    db.add(
        Membership(
            user_id=admin.id,
            family_id=family.id,
            role=RoleEnum.admin,
            estado=StatusEnum.activo,
        )
    )
    db.commit()
    db.refresh(family)
    return admin, family


def _create_invitation(db, admin):
    response = invitation_service.create_invitation(
        db, admin.id, CreateInvitationRequest(expira_en_horas=72)
    )
    invitation = db.query(Invitation).filter(Invitation.token == response.token).first()
    assert invitation is not None
    return invitation


def test_expired_invitation_returns_400_on_postgres(pg_db):
    admin, _ = _create_admin_family(pg_db)
    invitation = _create_invitation(pg_db, admin)
    invitation.expira_en = datetime.now(timezone.utc) - timedelta(hours=1)
    pg_db.commit()

    invited = _create_user(pg_db, "expired@example.com")

    with pytest.raises(HTTPException) as error:
        invitation_service.join_invitation(
            pg_db, invited.id, JoinInvitationRequest(token=invitation.token)
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Invitation expired"


def test_valid_invitation_join_succeeds_on_postgres(pg_db):
    admin, family = _create_admin_family(pg_db)
    invitation = _create_invitation(pg_db, admin)
    invited = _create_user(pg_db, "member@example.com")

    result = invitation_service.join_invitation(
        pg_db, invited.id, JoinInvitationRequest(token=invitation.token)
    )

    assert result.family_id == str(family.id)
    membership = (
        pg_db.query(Membership)
        .filter(
            Membership.user_id == invited.id,
            Membership.estado == StatusEnum.activo,
        )
        .first()
    )
    assert membership is not None
    assert membership.role == RoleEnum.member
