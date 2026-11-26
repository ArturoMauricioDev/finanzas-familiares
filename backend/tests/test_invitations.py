import uuid
from datetime import datetime, timedelta

from app.models.invitation import Invitation
from app.models.membership import FamilyRoleEnum, Membership, RoleEnum, StatusEnum
from tests.conftest import auth_headers, create_user


def _create_family(client, user):
    response = client.post(
        "/api/v1/families",
        json={"nombre": "Familia Test", "moneda_local": "MXN"},
        headers=auth_headers(user),
    )
    assert response.status_code == 201
    return uuid.UUID(response.json()["family"]["id"])


def _create_invitation(client, admin, rol_familiar="hijo", parentesco=None):
    payload = {"rol_familiar": rol_familiar}
    if parentesco is not None:
        payload["parentesco"] = parentesco
    response = client.post(
        "/api/v1/families/me/invitations",
        json=payload,
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["codigo"]
    assert "link" not in body
    return body


def test_create_invitation_requires_role(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.post(
        "/api/v1/families/me/invitations",
        json={},
        headers=auth_headers(admin),
    )
    assert response.status_code == 422


def test_create_invitation_rejects_invalid_role(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.post(
        "/api/v1/families/me/invitations",
        json={"rol_familiar": "primo"},
        headers=auth_headers(admin),
    )
    assert response.status_code == 422


def test_create_invitation_returns_and_persists_role(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.post(
        "/api/v1/families/me/invitations",
        json={"rol_familiar": "otro", "parentesco": "Cuñada"},
        headers=auth_headers(admin),
    )

    assert response.status_code == 201
    body = response.json()
    assert body["rol_familiar"] == "otro"
    assert body["parentesco"] == "Cuñada"
    invitation = db.query(Invitation).filter(Invitation.codigo == body["codigo"]).first()
    assert invitation is not None
    assert invitation.rol_familiar == FamilyRoleEnum.otro
    assert invitation.parentesco == "Cuñada"


def test_create_invitation_other_role_requires_kinship(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.post(
        "/api/v1/families/me/invitations",
        json={"rol_familiar": "otro"},
        headers=auth_headers(admin),
    )
    assert response.status_code == 422


def test_create_invitation_rejects_kinship_for_other_roles(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.post(
        "/api/v1/families/me/invitations",
        json={"rol_familiar": "hijo", "parentesco": "sobrino"},
        headers=auth_headers(admin),
    )
    assert response.status_code == 422


def test_create_invitation_rejects_blank_kinship_for_other_roles(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    response = client.post(
        "/api/v1/families/me/invitations",
        json={"rol_familiar": "hijo", "parentesco": "   "},
        headers=auth_headers(admin),
    )
    assert response.status_code == 422


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
        json={"rol_familiar": "hijo"},
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
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    assert response.json()["role"] == "member"
    assert response.json()["rol_familiar"] == "hijo"
    assert response.json()["tokens"]["access_token"]


def test_invitation_cannot_be_reused(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    first = create_user(db, email="first@example.com")
    assert (
        client.post(
            "/api/v1/invitations/join",
            json={"codigo": invitation["codigo"]},
            headers=auth_headers(first),
        ).status_code
        == 200
    )

    second = create_user(db, email="second@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(second),
    )
    assert response.status_code == 400


def test_invitation_expires_in_seven_days(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    expira = datetime.fromisoformat(invitation["expira_en"].replace("Z", "+00:00"))
    delta = expira - datetime.now(expira.tzinfo)
    assert timedelta(days=6, hours=23) < delta <= timedelta(days=7, minutes=1)


def test_invitation_code_is_normalized_on_join(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    variants = [
        lambda code: f"  {code.lower()}  ",
        lambda code: f"{code[:4]}-{code[4:]}",
        lambda code: " ".join(code),
    ]

    for index, variant in enumerate(variants):
        invitation = _create_invitation(client, admin)
        code = invitation["codigo"]

        invited = create_user(db, email=f"normalized{index}@example.com")
        response = client.post(
            "/api/v1/invitations/join",
            json={"codigo": variant(code)},
            headers=auth_headers(invited),
        )
        assert response.status_code == 200, response.text


def test_invalid_invitation_code_is_rejected(client, db):
    user = create_user(db)
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": "doesnotexist"},
        headers=auth_headers(user),
    )
    assert response.status_code == 400


def test_expired_invitation_is_rejected(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)

    invitation = Invitation(
        family_id=family_id,
        codigo="EXPIRED1",
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
        json={"codigo": "EXPIRED1"},
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
        json={"codigo": invitation["codigo"]},
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
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(extra),
    )
    assert response.status_code == 200


def test_join_as_parent_grants_admin_role(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin, rol_familiar="madre")

    invited = create_user(db, email="mother@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    assert response.json()["role"] == "admin"
    assert response.json()["rol_familiar"] == "madre"
    membership = db.query(Membership).filter(Membership.user_id == invited.id).first()
    assert membership is not None
    assert membership.role == RoleEnum.admin
    assert membership.rol_familiar == FamilyRoleEnum.madre


def test_join_ignores_role_sent_in_request(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin, rol_familiar="hijo")

    invited = create_user(db, email="father@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={
            "codigo": invitation["codigo"],
            "rol_familiar": "padre",
            "parentesco": "Padre",
        },
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    assert response.json()["role"] == "member"
    assert response.json()["rol_familiar"] == "hijo"
    membership = db.query(Membership).filter(Membership.user_id == invited.id).first()
    assert membership is not None
    assert membership.role == RoleEnum.member
    assert membership.rol_familiar == FamilyRoleEnum.hijo
    assert membership.parentesco is None


def test_legacy_invitation_without_role_joins_as_member(client, db):
    admin = create_user(db, email="admin@example.com")
    family_id = _create_family(client, admin)
    invitation = Invitation(
        family_id=family_id,
        codigo="LEGACY01",
        token=None,
        generado_por=admin.id,
        expira_en=datetime.utcnow() + timedelta(days=1),
        usado=False,
        rol_familiar=None,
    )
    db.add(invitation)
    db.commit()

    invited = create_user(db, email="legacy@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": "LEGACY01"},
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    assert response.json()["role"] == "member"
    assert response.json()["rol_familiar"] is None
    membership = db.query(Membership).filter(Membership.user_id == invited.id).first()
    assert membership is not None
    assert membership.role == RoleEnum.member
    assert membership.rol_familiar is None


def test_join_as_child_stays_member(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin, rol_familiar="hijo")

    invited = create_user(db, email="son@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    assert response.json()["role"] == "member"
    membership = db.query(Membership).filter(Membership.user_id == invited.id).first()
    assert membership is not None
    assert membership.role == RoleEnum.member
    assert membership.rol_familiar == FamilyRoleEnum.hijo


def test_join_copies_parentesco_from_invitation(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin, rol_familiar="otro", parentesco="Sobrina")

    invited = create_user(db, email="niece@example.com")
    response = client.post(
        "/api/v1/invitations/join",
        json={"codigo": invitation["codigo"]},
        headers=auth_headers(invited),
    )

    assert response.status_code == 200
    membership = db.query(Membership).filter(Membership.user_id == invited.id).first()
    assert membership is not None
    assert membership.rol_familiar == FamilyRoleEnum.otro
    assert membership.parentesco == "Sobrina"


def test_join_as_extended_roles_stays_member(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)

    cases = [
        ("tio", None),
        ("abuelo", None),
        ("otro", "Cuñada"),
    ]
    for index, (role, kinship) in enumerate(cases):
        invitation = _create_invitation(
            client, admin, rol_familiar=role, parentesco=kinship
        )
        invited = create_user(db, email=f"extended{index}@example.com")
        response = client.post(
            "/api/v1/invitations/join",
            json={"codigo": invitation["codigo"]},
            headers=auth_headers(invited),
        )
        assert response.status_code == 200, response.text
        assert response.json()["role"] == "member"
        membership = db.query(Membership).filter(Membership.user_id == invited.id).first()
        assert membership is not None
        assert membership.role == RoleEnum.member
        assert membership.rol_familiar == FamilyRoleEnum(role)


def test_get_invitation_reports_used_status(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    pending = client.get(
        f"/api/v1/families/me/invitations/{invitation['invitation_id']}",
        headers=auth_headers(admin),
    )
    assert pending.status_code == 200
    assert pending.json()["usado"] is False

    invited = create_user(db, email="invited@example.com")
    assert (
        client.post(
            "/api/v1/invitations/join",
            json={"codigo": invitation["codigo"]},
            headers=auth_headers(invited),
        ).status_code
        == 200
    )

    used = client.get(
        f"/api/v1/families/me/invitations/{invitation['invitation_id']}",
        headers=auth_headers(admin),
    )
    assert used.status_code == 200
    assert used.json()["usado"] is True


def test_get_invitation_from_another_family_is_not_found(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    outsider = create_user(db, email="outsider@example.com")
    _create_family(client, outsider)

    response = client.get(
        f"/api/v1/families/me/invitations/{invitation['invitation_id']}",
        headers=auth_headers(outsider),
    )
    assert response.status_code == 404


def test_member_cannot_get_invitation(client, db):
    admin = create_user(db, email="admin@example.com")
    _create_family(client, admin)
    invitation = _create_invitation(client, admin)

    invited = create_user(db, email="invited@example.com")
    assert (
        client.post(
            "/api/v1/invitations/join",
            json={"codigo": invitation["codigo"]},
            headers=auth_headers(invited),
        ).status_code
        == 200
    )

    response = client.get(
        f"/api/v1/families/me/invitations/{invitation['invitation_id']}",
        headers=auth_headers(invited),
    )
    assert response.status_code == 403
