from app import create_app


def _client(tmp_path, monkeypatch, admin=False):
    db_path = tmp_path / "integration-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("MODERATOR_EMAILS", "moderator@example.com")
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com" if admin else "")
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def _register(client, email, name="Learner"):
    response = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "secret123",
            "display_name": name,
        },
    )
    assert response.status_code == 200
    return response.get_json()["access_token"]


def test_settings_roundtrip(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    token = _register(client, "settings@example.com", "Settings Learner")

    saved = client.put(
        "/api/settings/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "theme": "dark",
            "language": "Spanish",
            "notifications": {
                "daily_tasks": False,
                "weekly_quiz": True,
                "achievements": False,
                "streak_alerts": True,
            },
        },
    )
    assert saved.status_code == 200

    loaded = client.get(
        "/api/settings/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert loaded.status_code == 200
    data = loaded.get_json()
    assert data["theme"] == "dark"
    assert data["language"] == "Spanish"
    assert data["notifications"]["daily_tasks"] is False


def test_code_lab_runs_python(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    token = _register(client, "lab@example.com", "Lab User")

    challenge = client.get(
        "/api/lab/challenge?language=python",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert challenge.status_code == 200
    challenge_data = challenge.get_json()
    assert challenge_data["language"] == "python"

    run = client.post(
        "/api/lab/run",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "language": "python",
            "challenge_key": challenge_data["key"],
            "title": challenge_data["title"],
            "source_code": challenge_data["starter_code"],
        },
    )
    assert run.status_code == 200
    data = run.get_json()
    assert "stdout" in data
    assert data["submission_id"]
    assert isinstance(data["tests"], list)


def test_moderation_queue_is_accessible_to_admin(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch, admin=True)
    token = _register(client, "admin@example.com", "Admin User")

    queue = client.get(
        "/api/moderation/queue",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert queue.status_code == 200
    data = queue.get_json()
    assert "items" in data
