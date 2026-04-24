from app import create_app


def _client(tmp_path, monkeypatch):
    db_path = tmp_path / "auth-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def test_register_login_and_me(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)

    register = client.post(
        "/api/auth/register",
        json={
            "email": "learner@example.com",
            "password": "secret123",
            "display_name": "Learner",
        },
    )
    assert register.status_code == 200
    register_data = register.get_json()
    assert register_data["user"]["email"] == "learner@example.com"
    assert register_data["user"]["onboarded"] is False

    login = client.post(
        "/api/auth/login",
        json={
            "email": "learner@example.com",
            "password": "secret123",
        },
    )
    assert login.status_code == 200
    token = login.get_json()["access_token"]

    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    me_data = me.get_json()
    assert me_data["email"] == "learner@example.com"
    assert me_data["displayName"] == "Learner"


def test_login_rejects_bad_password(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)

    client.post(
        "/api/auth/register",
        json={
            "email": "learner@example.com",
            "password": "secret123",
            "display_name": "Learner",
        },
    )

    login = client.post(
        "/api/auth/login",
        json={
            "email": "learner@example.com",
            "password": "wrongpass",
        },
    )
    assert login.status_code == 401
