import uuid

from app.models.family import Family, FamilyStatusEnum
from app.models.membership import Membership, RoleEnum, StatusEnum
from app.models.user import User, UserStatusEnum
from app.services import auth_service
from tests.conftest import auth_headers, create_user


def _create_family(client, user):
    response = client.post(
        "/api/v1/families",
        json={"nombre": "Familia Test", "moneda_local": "MXN"},
        headers=auth_headers(user),
    )
    assert response.status_code == 201
    return uuid.UUID(response.json()["family"]["id"])


def _join_family(client, admin, invited):
    invitation = client.post(
        "/api/v1/families/me/invitations",
        json={"rol_familiar": "hijo"},
        headers=auth_headers(admin),
    ).json()
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(invited),
    )
    assert response.status_code == 200


def test_delete_account_soft_deletes_user_and_sole_family(client, db):
    user = create_user(db, email="solo@example.com")
    family_id = _create_family(client, user)

    response = client.delete("/api/v1/users/me", headers=auth_headers(user))

    assert response.status_code == 204

    db.expire_all()
    deleted_user = db.query(User).filter(User.id == user.id).one()
    family = db.query(Family).filter(Family.id == family_id).one()
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user.id)
        .one()
    )

    assert deleted_user.estado == UserStatusEnum.eliminado
    assert deleted_user.fecha_eliminacion is not None
    assert family.estado == FamilyStatusEnum.eliminado
    assert family.fecha_eliminacion is not None
    assert membership.estado == StatusEnum.inactivo


def test_delete_account_leaves_family_and_reassigns_admin(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)
    member = create_user(db, email="member@example.com")
    _join_family(client, admin, member)

    response = client.delete("/api/v1/users/me", headers=auth_headers(admin))

    assert response.status_code == 204

    db.expire_all()
    family = db.query(Family).filter(Family.id == family_id).one()
    deleted_user = db.query(User).filter(User.id == admin.id).one()
    deleted_membership = (
        db.query(Membership).filter(Membership.user_id == admin.id).one()
    )
    promoted = db.query(Membership).filter(Membership.user_id == member.id).one()

    assert family.estado == FamilyStatusEnum.activo
    assert deleted_user.estado == UserStatusEnum.eliminado
    assert deleted_membership.estado == StatusEnum.inactivo
    assert promoted.estado == StatusEnum.activo
    assert promoted.role == RoleEnum.admin


def test_deleted_account_cannot_authenticate(client, db, monkeypatch):
    user = create_user(db, email="gone@example.com", google_id="google-gone")
    _create_family(client, user)
    assert (
        client.delete("/api/v1/users/me", headers=auth_headers(user)).status_code == 204
    )

    def fake_verify(_token, _request, _audience):
        return {"sub": "google-gone", "email": "gone@example.com"}

    monkeypatch.setattr(auth_service.id_token, "verify_oauth2_token", fake_verify)

    response = client.post("/api/v1/auth/google", json={"id_token": "valid-google-token"})

    assert response.status_code == 403


def test_deleted_account_session_is_rejected(client, db):
    user = create_user(db, email="closed@example.com")
    headers = auth_headers(user)
    assert client.delete("/api/v1/users/me", headers=headers).status_code == 204

    response = client.get("/api/v1/auth/session", headers=headers)

    assert response.status_code == 401


def test_delete_account_blocks_further_requests(client, db):
    user = create_user(db, email="twice@example.com")

    first = client.delete("/api/v1/users/me", headers=auth_headers(user))
    second = client.delete("/api/v1/users/me", headers=auth_headers(user))

    assert first.status_code == 204
    assert second.status_code == 401