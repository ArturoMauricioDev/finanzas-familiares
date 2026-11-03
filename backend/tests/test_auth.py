from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.models.user import User
from app.services import auth_service
from tests.conftest import create_user


def test_invalid_google_token_returns_401(client):
    response = client.post("/api/v1/auth/google", json={"id_token": "not-a-valid-token"})
    assert response.status_code == 401


def test_missing_google_client_id_rejects_tokens(client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", None)
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", None)
    response = client.post("/api/v1/auth/google", json={"id_token": "anything"})
    assert response.status_code == 401


def test_google_token_accepts_legacy_web_audience(monkeypatch):
    calls = []

    def fake_verify(_token, _request, audience):
        calls.append(audience)
        return {"sub": "google-1", "email": "user@example.com"}

    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "web-client-id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", None)
    monkeypatch.setattr(auth_service.id_token, "verify_oauth2_token", fake_verify)

    result = auth_service._verify_google_token("token")

    assert result == {"google_id": "google-1", "email": "user@example.com"}
    assert calls == ["web-client-id"]


def test_google_token_accepts_configured_native_audiences(monkeypatch):
    calls = []

    def fake_verify(_token, _request, audience):
        calls.append(audience)
        if audience == "android-client-id":
            return {"sub": "google-1", "email": "user@example.com"}
        raise ValueError("Wrong audience")

    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "web-client-id")
    monkeypatch.setattr(
        settings,
        "GOOGLE_CLIENT_IDS",
        "android-client-id, ios-client-id,web-client-id",
    )
    monkeypatch.setattr(auth_service.id_token, "verify_oauth2_token", fake_verify)

    result = auth_service._verify_google_token("token")

    assert result == {"google_id": "google-1", "email": "user@example.com"}
    assert calls == ["web-client-id", "android-client-id"]


def test_google_token_rejects_unconfigured_audience(monkeypatch):
    def fake_verify(_token, _request, _audience):
        raise ValueError("Wrong audience")

    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "web-client-id")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", "android-client-id")
    monkeypatch.setattr(auth_service.id_token, "verify_oauth2_token", fake_verify)

    assert auth_service._verify_google_token("token") is None


def test_protected_endpoint_without_token_returns_401(client):
    response = client.get("/api/v1/families/me")
    assert response.status_code == 401


def test_protected_endpoint_with_invalid_token_returns_401(client):
    response = client.get(
        "/api/v1/families/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401


def test_refresh_token_type_is_enforced(client):
    access_token = create_access_token({"user_id": "00000000-0000-0000-0000-000000000001"})
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})
    assert response.status_code == 401


def test_access_token_contains_expected_claims():
    token = create_access_token({"user_id": "user-1", "family_id": None, "role": None})
    payload = verify_token(token)
    assert payload["user_id"] == "user-1"
    assert payload["family_id"] is None
    assert payload["role"] is None
    assert payload["type"] == "access"


def test_refresh_token_contains_refresh_type():
    token = create_refresh_token({"user_id": "user-1"})
    payload = verify_token(token)
    assert payload["type"] == "refresh"


def _mock_google_identity(monkeypatch, sub="google-new", email="new@example.com"):
    def fake_verify(_token, _request, _audience):
        return {"sub": sub, "email": email}

    monkeypatch.setattr(auth_service.id_token, "verify_oauth2_token", fake_verify)


def test_google_login_creates_user_and_returns_claims(client, db, monkeypatch):
    _mock_google_identity(monkeypatch)

    response = client.post("/api/v1/auth/google", json={"id_token": "valid-google-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["needs_profile_setup"] is True
    assert body["needs_family_setup"] is True
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["family_id"] is None
    assert body["user"]["role"] is None

    access_payload = verify_token(body["access_token"])
    assert access_payload["type"] == "access"
    assert access_payload["user_id"] == body["user"]["id"]
    assert access_payload["family_id"] is None
    assert access_payload["role"] is None

    user = db.query(User).filter(User.google_id == "google-new").one()
    assert user.email == "new@example.com"
    assert user.nombre_visualizacion is None
    assert user.foto_avatar is None


def test_google_login_reuses_existing_user(client, db, monkeypatch):
    user = create_user(db, email="existing@example.com", google_id="google-existing")
    _mock_google_identity(
        monkeypatch,
        sub="google-existing",
        email="existing@example.com",
    )

    response = client.post("/api/v1/auth/google", json={"id_token": "valid-google-token"})

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == str(user.id)
    assert body["needs_profile_setup"] is False
    assert body["needs_family_setup"] is True
    assert db.query(User).filter(User.google_id == "google-existing").count() == 1
