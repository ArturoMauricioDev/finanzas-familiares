from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.services import auth_service


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
