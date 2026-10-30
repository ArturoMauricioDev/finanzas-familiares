from tests.conftest import auth_headers, create_user


def test_update_profile_success(client, db):
    user = create_user(db, nombre=None, avatar=None)
    response = client.put(
        "/api/v1/users/me/profile",
        json={
            "nombre_visualizacion": "Ana Pérez",
            "foto_avatar": "https://example.com/ana.png",
        },
        headers=auth_headers(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["nombre_visualizacion"] == "Ana Pérez"
    assert body["foto_avatar"] == "https://example.com/ana.png"


def test_update_profile_rejects_empty_name(client, db):
    user = create_user(db)
    response = client.put(
        "/api/v1/users/me/profile",
        json={"nombre_visualizacion": "", "foto_avatar": "https://example.com/a.png"},
        headers=auth_headers(user),
    )
    assert response.status_code == 422


def test_update_profile_rejects_empty_avatar(client, db):
    user = create_user(db)
    response = client.put(
        "/api/v1/users/me/profile",
        json={"nombre_visualizacion": "Ana", "foto_avatar": ""},
        headers=auth_headers(user),
    )
    assert response.status_code == 422
