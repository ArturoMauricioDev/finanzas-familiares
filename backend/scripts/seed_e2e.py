"""Siembra determinista para las pruebas E2E de Playwright.

Herramienta de desarrollo/pruebas: no la importa la aplicación y no se ejecuta en
producción. Se niega a correr salvo que `KITHO_E2E_SEED=1` y el `DATABASE_URL`
apunte a una base cuyo nombre contenga "e2e", para que nunca toque datos reales.

Genera identidades (no datos de negocio): los tests crean sus propias familias e
invitaciones con la API. Así los códigos de un solo uso y los borrados no se
contaminan entre pruebas.

Uso (dentro del contenedor `backend-e2e`):

    python -m scripts.seed_e2e --reset
    python -m scripts.seed_e2e --reset --output /app/.e2e/seed.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote

# Permite ejecutar el archivo como script (`python scripts/seed_e2e.py`) además de
# como módulo (`python -m scripts.seed_e2e`).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import create_access_token, create_refresh_token  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.family import Family, FamilyStatusEnum  # noqa: E402
from app.models.invitation import Invitation  # noqa: E402
from app.models.membership import (  # noqa: E402
    FamilyRoleEnum,
    Membership,
    RoleEnum,
    StatusEnum,
)
from app.models.user import User  # noqa: E402

ACTOR_COUNT = 36
DEFAULT_OUTPUT = Path("/app/.e2e/seed.json")


def _guard() -> None:
    if os.environ.get("KITHO_E2E_SEED") != "1":
        raise SystemExit(
            "seed_e2e: define KITHO_E2E_SEED=1 para confirmar que es un entorno de pruebas"
        )
    if "e2e" not in settings.DATABASE_URL.lower():
        raise SystemExit(
            "seed_e2e: DATABASE_URL debe apuntar a una base de datos de pruebas (contener 'e2e')"
        )


def _avatar(letter: str, color: str) -> str:
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">'
        f'<rect width="40" height="40" rx="20" fill="{color}"/>'
        '<text x="20" y="26" font-family="sans-serif" font-size="16" fill="#ffffff"'
        f' text-anchor="middle">{letter}</text></svg>'
    )
    return "data:image/svg+xml;utf8," + quote(svg)


def _session(user: User, membership: Membership | None, *, expired: bool = False) -> dict:
    family_id = str(membership.family_id) if membership else None
    role = membership.role.value if membership else None
    payload = {"user_id": str(user.id), "family_id": family_id, "role": role}
    access_delta = timedelta(minutes=-5) if expired else None
    access_token = create_access_token(payload, expires_delta=access_delta)
    refresh_token = "invalid-refresh-token" if expired else create_refresh_token(payload)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "nombre_visualizacion": user.nombre_visualizacion,
            "foto_avatar": user.foto_avatar,
            "family_id": family_id,
            "role": role,
        },
        "needs_profile_setup": not (user.nombre_visualizacion and user.foto_avatar),
        "needs_family_setup": membership is None,
    }


def _reset(db) -> None:
    db.execute(
        text(
            "TRUNCATE TABLE invitations, memberships, families, users "
            "RESTART IDENTITY CASCADE"
        )
    )
    db.commit()


def _create_user(db, *, email: str, name: str | None, color: str) -> User:
    user = User(
        google_id=f"e2e-google-{email}",
        email=email,
        nombre_visualizacion=name,
        foto_avatar=_avatar(name[0], color) if name else None,
    )
    db.add(user)
    db.flush()
    return user


def _create_family(db, *, owner: User, name: str, currency: str) -> Family:
    family = Family(
        nombre=name,
        moneda_local=currency,
        creado_por=owner.id,
        estado=FamilyStatusEnum.activo,
    )
    db.add(family)
    db.flush()
    return family


def _add_member(
    db,
    *,
    user: User,
    family: Family,
    role: RoleEnum,
    family_role: FamilyRoleEnum,
    kinship: str | None = None,
) -> Membership:
    membership = Membership(
        user_id=user.id,
        family_id=family.id,
        role=role,
        rol_familiar=family_role,
        parentesco=kinship,
        estado=StatusEnum.activo,
    )
    db.add(membership)
    db.flush()
    return membership


def _create_invitation(
    db,
    *,
    family: Family,
    generated_by: User,
    code: str,
    days: int,
    used: bool = False,
    family_role: FamilyRoleEnum | None = None,
    kinship: str | None = None,
) -> Invitation:
    now = datetime.now(timezone.utc)
    invitation = Invitation(
        family_id=family.id,
        codigo=code,
        token=None,
        generado_por=generated_by.id,
        expira_en=now + timedelta(days=days),
        usado=used,
        fecha_uso=now - timedelta(days=1) if used else None,
        rol_familiar=family_role,
        parentesco=kinship,
    )
    db.add(invitation)
    db.flush()
    return invitation


def seed() -> dict:
    db = SessionLocal()
    try:
        admin = _create_user(db, email="admin@e2e.kitho.test", name="Ana Admin", color="#6750A4")
        member = _create_user(db, email="member@e2e.kitho.test", name="Beto Miembro", color="#386A20")
        solo = _create_user(db, email="solo@e2e.kitho.test", name="Sofía Sola", color="#8B5000")
        familyless = _create_user(
            db, email="familyless@e2e.kitho.test", name="Fede SinFamilia", color="#00696E"
        )
        new_user = _create_user(db, email="new@e2e.kitho.test", name=None, color="#984061")

        family = _create_family(db, owner=admin, name="Familia E2E", currency="EUR")
        admin_membership = _add_member(
            db,
            user=admin,
            family=family,
            role=RoleEnum.admin,
            family_role=FamilyRoleEnum.padre,
        )
        member_membership = _add_member(
            db,
            user=member,
            family=family,
            role=RoleEnum.member,
            family_role=FamilyRoleEnum.hijo,
        )

        expired_invitation = _create_invitation(
            db,
            family=family,
            generated_by=admin,
            code="EXPIRE22",
            days=-1,
            family_role=FamilyRoleEnum.hijo,
        )
        used_invitation = _create_invitation(
            db,
            family=family,
            generated_by=admin,
            code="USEDCODE",
            days=7,
            used=True,
            family_role=FamilyRoleEnum.hijo,
        )
        legacy_invitation = _create_invitation(
            db,
            family=family,
            generated_by=admin,
            code="LEGACY22",
            days=7,
            family_role=None,
        )

        solo_family = _create_family(db, owner=solo, name="Familia Solo", currency="MXN")
        solo_membership = _add_member(
            db,
            user=solo,
            family=solo_family,
            role=RoleEnum.admin,
            family_role=FamilyRoleEnum.madre,
        )

        actors = []
        for index in range(1, ACTOR_COUNT + 1):
            actor = _create_user(
                db,
                email=f"actor-{index:02d}@e2e.kitho.test",
                name=f"Actor {index:02d}",
                color="#4A5C92",
            )
            actors.append({"key": f"actor-{index:02d}", "session": _session(actor, None)})

        db.commit()

        payload = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "apiUrl": "http://localhost:8001",
            "users": {
                "admin": _session(admin, admin_membership),
                "member": _session(member, member_membership),
                "solo": _session(solo, solo_membership),
                "familyless": _session(familyless, None),
                "newUser": _session(new_user, None),
                "expired": _session(admin, admin_membership, expired=True),
            },
            "families": {
                "main": {"id": str(family.id), "name": family.nombre, "currency": family.moneda_local},
                "solo": {
                    "id": str(solo_family.id),
                    "name": solo_family.nombre,
                    "currency": solo_family.moneda_local,
                },
            },
            "actors": actors,
            "invitations": {
                "expired": expired_invitation.codigo,
                "used": used_invitation.codigo,
                "legacy": legacy_invitation.codigo,
            },
        }
        return payload
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Siembra las identidades de las pruebas E2E")
    parser.add_argument("--reset", action="store_true", help="vacía las tablas antes de sembrar")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="ruta del JSON de salida")
    args = parser.parse_args()

    _guard()

    db = SessionLocal()
    try:
        if args.reset:
            _reset(db)
    finally:
        db.close()

    payload = seed()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"seed_e2e: {len(payload['actors'])} actores y 5 identidades escritos en {output}")


if __name__ == "__main__":
    main()
