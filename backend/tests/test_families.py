import uuid

from app.models.membership import Membership, RoleEnum, StatusEnum
from tests.conftest import auth_headers, create_user


def _create_family(client, user, nombre="Familia Pérez", moneda="MXN"):
    return client.post(
        "/api/v1/families",
        json={"nombre": nombre, "moneda_local": moneda},
        headers=auth_headers(user),
    )


def test_create_family_assigns_admin_role(client, db):
    user = create_user(db)
    response = _create_family(client, user, moneda="mxn")

    assert response.status_code == 201
    body = response.json()
    assert body["family"]["moneda_local"] == "MXN"
    assert body["membership"]["role"] == "admin"
    assert body["tokens"]["access_token"]


def test_second_family_is_rejected(client, db):
    user = create_user(db)
    assert _create_family(client, user).status_code == 201

    response = _create_family(client, user, nombre="Otra familia")
    assert response.status_code == 400


def test_invalid_currency_is_rejected(client, db):
    user = create_user(db)
    response = _create_family(client, user, moneda="MXNX")
    assert response.status_code == 422


def test_get_family_without_membership_returns_403(client, db):
    user = create_user(db)
    response = client.get("/api/v1/families/me", headers=auth_headers(user))
    assert response.status_code == 403


def test_family_detail_lists_active_members(client, db):
    admin = create_user(db, email="admin@example.com")
    create_response = _create_family(client, admin)
    family_id = uuid.UUID(create_response.json()["family"]["id"])

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

    response = client.get("/api/v1/families/me", headers=auth_headers(admin))
    assert response.status_code == 200
    assert response.json()["member_count"] == 2


def test_admin_cannot_remove_self(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.delete(
        f"/api/v1/families/me/members/{admin.id}",
        headers=auth_headers(admin),
    )
    assert response.status_code == 400


def test_admin_can_promote_and_remove_member(client, db):
    admin = create_user(db, email="admin@example.com")
    create_response = _create_family(client, admin)
    family_id = uuid.UUID(create_response.json()["family"]["id"])

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

    promote = client.post(
        f"/api/v1/families/me/members/{member.id}/promote",
        headers=auth_headers(admin),
    )
    assert promote.status_code == 200
    assert promote.json()["role"] == "admin"

    remove = client.delete(
        f"/api/v1/families/me/members/{member.id}",
        headers=auth_headers(admin),
    )
    assert remove.status_code == 200


def _add_member(db, family_id, email):
    member = create_user(db, email=email)
    db.add(
        Membership(
            user_id=member.id,
            family_id=family_id,
            role=RoleEnum.member,
            estado=StatusEnum.activo,
        )
    )
    db.commit()
    db.refresh(member)
    return member


def test_member_cannot_promote_member(client, db):
    admin = create_user(db, email="admin@example.com")
    create_response = _create_family(client, admin)
    family_id = uuid.UUID(create_response.json()["family"]["id"])

    actor = _add_member(db, family_id, "actor@example.com")
    target = _add_member(db, family_id, "target@example.com")

    response = client.post(
        f"/api/v1/families/me/members/{target.id}/promote",
        headers=auth_headers(actor, family_id=family_id, role="member"),
    )

    assert response.status_code == 403


def test_member_cannot_remove_member(client, db):
    admin = create_user(db, email="admin@example.com")
    create_response = _create_family(client, admin)
    family_id = uuid.UUID(create_response.json()["family"]["id"])

    actor = _add_member(db, family_id, "actor@example.com")
    target = _add_member(db, family_id, "target@example.com")

    response = client.delete(
        f"/api/v1/families/me/members/{target.id}",
        headers=auth_headers(actor, family_id=family_id, role="member"),
    )

    assert response.status_code == 403


def test_last_admin_cannot_be_removed(client, db):
    admin = create_user(db, email="admin@example.com")
    create_response = _create_family(client, admin)
    family_id = uuid.UUID(create_response.json()["family"]["id"])

    response = client.delete(
        f"/api/v1/families/me/members/{admin.id}",
        headers=auth_headers(admin, family_id=family_id, role="admin"),
    )

    assert response.status_code == 400
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == admin.id, Membership.family_id == family_id)
        .first()
    )
    assert membership is not None
    assert membership.estado == StatusEnum.activo
