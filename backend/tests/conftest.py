import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.deps import get_db
from app.core.security import create_access_token
from app.db.base import Base
from app.main import app
from app.models.user import User

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


def create_user(
    db,
    email="user@example.com",
    google_id=None,
    nombre="Usuario",
    avatar="https://example.com/avatar.png",
):
    user = User(
        google_id=google_id or f"google-{email}",
        email=email,
        nombre_visualizacion=nombre,
        foto_avatar=avatar,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user, family_id=None, role=None):
    token = create_access_token(
        {
            "user_id": str(user.id),
            "family_id": str(family_id) if family_id else None,
            "role": role,
        }
    )
    return {"Authorization": f"Bearer {token}"}
