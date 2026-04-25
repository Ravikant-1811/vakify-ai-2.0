from app import create_app


def _client(tmp_path, monkeypatch):
    db_path = tmp_path / "chat-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    app = create_app()
    app.config.update(TESTING=True)
    return app.test_client()


def test_structured_chat_response_and_history(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)

    register = client.post(
        "/api/auth/register",
        json={
            "email": "chat@example.com",
            "password": "secret123",
            "display_name": "Chat Learner",
        },
    )
    token = register.get_json()["access_token"]

    style = client.post(
        "/api/style/select",
        headers={"Authorization": f"Bearer {token}"},
        json={"learning_style": "visual"},
    )
    assert style.status_code == 200

    response = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "question": "Explain recursion in simple terms",
            "mode": "detailed",
        },
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["answer"]
    assert isinstance(data["follow_up_prompts"], list)
    assert data["chat_id"]

    history = client.get(
        "/api/chat/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history.status_code == 200
    rows = history.get_json()
    assert rows[0]["response"]
    assert rows[0]["response_json"] is None
