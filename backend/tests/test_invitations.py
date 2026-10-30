import uuid
from datetime import datetime, timedelta

from app.models.invitation import Invitation
from app.models.membership import Membership, RoleEnum, StatusEnum
from tests.conftest import auth_headers, create_user


def _create_family(client, user):
    response = client.post(
        "/api/v1/families",
        json={"nombre": "Familia Test", "moneda_local": "MXN"},
        headers=auth_headers(user),
    )
    assert response.status_code == 201
    return uuid.UUID(response.json()["family"]["id"])


def _create_invitation(client, admin):
    response = client.post(
        "/api/v1/families/me/invitations",
        json={"expira_en_horas": 72},
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    return response.json()


def test_member_cannot_create_invitation(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)

    member = create_user(db, email="member@example.com")
    db.add(
        Membership(
            user_id=member.id,
            family_id=family_id,
            role=RoleEnum.member,
            estado=StatusEnum.activo,
        )
    )
    db.commit()

    response = client.post(
        "/api/v1/families/me/invitations",
        json={"expira_en_horas": 72},
        headers=auth_headers(member),
    )
    assert response.status_code == 403


def test_invitation_join_creates_member(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    invited = create_user(db, email="invited@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"token": invitation["token"], "parentesco": "hija"},
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    assert response.json()["role"] == "member"
    assert response.json()["tokens"]["access_token"]


def test_invitation_cannot_be_reused(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    first = create_user(db, email="first@example.com")
    assert (
        client.post(
            "/api/v1/invitations/join",
            json={"token": invitation["token"]},
            headers=auth_headers(first),
        ).status_code
        == 200
    )

    second = create_user(db, email="second@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"token": invitation["token"]},
        headers=auth_headers(second),
    )
    assert response.status_code == 400


def test_invalid_invitation_token_is_rejected(client, db):
    user = create_user(db)
    response = client.post(
        "/api/v1/invitations/join",
        json={"token": "does-not-exist"},
        headers=auth_headers(user),
    )
    assert response.status_code == 400


def test_expired_invitation_is_rejected(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)

    invitation = Invitation(
        family_id=family_id,
        token="expired-token",
        generado_por=admin.id,
        expira_en=datetime.utcnow() - timedelta(hours=1),
        usado=False,
    )
    db.add(invitation)
    db.commit()

    user = create_user(db, email="late@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"token": "expired-token"},
        headers=auth_headers(user),
    )
    assert response.status_code == 400


def test_member_limit_is_enforced(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    for index in range(9):
        member = create_user(db, email=f"member{index}@example.com")
        db.add(
            Membership(
                user_id=member.id,
                family_id=family_id,
                role=RoleEnum.member,
                estado=StatusEnum.activo,
            )
        )
    db.commit()

    extra = create_user(db, email="extra@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"token": invitation["token"]},
        headers=auth_headers(extra),
    )
    assert response.status_code == 400
    assert "limit" in response.json()["detail"].lower()


def test_inactive_members_do_not_count_towards_limit(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    for index in range(9):
        member = create_user(db, email=f"inactive{index}@example.com")
        db.add(
            Membership(
                user_id=member.id,
                family_id=family_id,
                role=RoleEnum.member,
                estado=StatusEnum.inactivo,
            )
        )
    db.commit()

    extra = create_user(db, email="extra@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"token": invitation["token"]},
        headers=auth_headers(extra),
    )
    assert response.status_code == 200
