from app import create_app


def _client(tmp_path, monkeypatch):
    db_path = tmp_path / "ai-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def test_study_plan_endpoint_returns_plan(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)

    register = client.post(
        "/api/auth/register",
        json={
            "email": "ai@example.com",
            "password": "secret123",
            "display_name": "AI Learner",
        },
    )
    token = register.get_json()["access_token"]

    response = client.get(
        "/api/ai/study-plan",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["title"]
    assert isinstance(data["today_plan"], list)
    assert isinstance(data["weekly_plan"], list)
