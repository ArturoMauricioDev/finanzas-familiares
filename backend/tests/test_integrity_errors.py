import uuid
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.family import Family
from app.models.invitation import Invitation
from app.schemas.family import CreateFamilyRequest
from app.schemas.invitation import JoinInvitationRequest
from app.services import auth_service, family_service, invitation_service
from tests.conftest import create_user


def _integrity_error():
    return IntegrityError("statement", {}, Exception("unique constraint"))


def _raise_integrity_error():
    raise _integrity_error()


def test_create_family_integrity_conflict_maps_to_400(monkeypatch, db):
    user = create_user(db, email="family-race@example.com")
    checks = {"count": 0}

    def active_membership(*_args, **_kwargs):
        checks["count"] += 1
        return None if checks["count"] == 1 else object()

    monkeypatch.setattr(family_service, "_active_membership", active_membership)
    monkeypatch.setattr(db, "commit", _raise_integrity_error)

    with pytest.raises(HTTPException) as error:
        family_service.create_family(
            db,
            user.id,
            CreateFamilyRequest(nombre="Familia", moneda_local="MXN"),
        )

    assert error.value.status_code == 400


def test_join_invitation_integrity_conflict_maps_to_400(monkeypatch, db):
    admin = create_user(db, email="invite-admin@example.com")
    invited = create_user(db, email="invite-race@example.com")
    family = Family(
        id=uuid.uuid4(),
        nombre="Familia",
        moneda_local="MXN",
        creado_por=admin.id,
    )
    db.add(family)
    db.flush()
    invitation = Invitation(
        family_id=family.id,
        token="race-token",
        generado_por=admin.id,
        expira_en=datetime.utcnow() + timedelta(hours=1),
        usado=False,
    )
    db.add(invitation)
    db.commit()

    checks = {"count": 0}

    def active_membership(*_args, **_kwargs):
        checks["count"] += 1
        return None if checks["count"] == 1 else object()

    monkeypatch.setattr(invitation_service, "_active_membership", active_membership)
    monkeypatch.setattr(db, "commit", _raise_integrity_error)

    with pytest.raises(HTTPException) as error:
        invitation_service.join_invitation(
            db,
            invited.id,
            JoinInvitationRequest(token="race-token"),
        )

    assert error.value.status_code == 400


def test_google_account_conflict_maps_to_409(monkeypatch, db):
    monkeypatch.setattr(
        auth_service,
        "_verify_google_token",
        lambda _token: {"google_id": "google-race", "email": "race@example.com"},
    )
    monkeypatch.setattr(db, "commit", _raise_integrity_error)

    with pytest.raises(HTTPException) as error:
        auth_service.authenticate_with_google(db, "google-token")

    assert error.value.status_code == 409
