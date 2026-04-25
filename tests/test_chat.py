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

    thread = client.post(
        "/api/chat/threads",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Recursion Chat"},
    )
    assert thread.status_code == 201
    thread_id = thread.get_json()["thread_id"]

    response = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "question": "Explain recursion in simple terms",
            "mode": "detailed",
            "thread_id": thread_id,
        },
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["answer"]
    assert isinstance(data["follow_up_prompts"], list)
    assert data["chat_id"]
    assert data["thread_id"] == thread_id

    history = client.get(
        f"/api/chat/history?thread_id={thread_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history.status_code == 200
    rows = history.get_json()
    assert rows[0]["response"]
    assert rows[0]["response_json"] is None
    assert rows[0]["thread_id"] == thread_id

    second_thread = client.post(
        "/api/chat/threads",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Debugging Chat"},
    )
    assert second_thread.status_code == 201
    second_thread_id = second_thread.get_json()["thread_id"]

    second_response = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "question": "Give me a Java example",
            "thread_id": second_thread_id,
        },
    )
    assert second_response.status_code == 200
    assert second_response.get_json()["thread_id"] == second_thread_id

    thread_list = client.get(
        "/api/chat/threads",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert thread_list.status_code == 200
    threads = thread_list.get_json()["threads"]
    assert threads[0]["thread_id"] == second_thread_id
    assert threads[0]["message_count"] == 1

    first_history = client.get(
        f"/api/chat/history?thread_id={thread_id}",
        headers={"Authorization": f"Bearer {token}"},
    ).get_json()
    second_history = client.get(
        f"/api/chat/history?thread_id={second_thread_id}",
        headers={"Authorization": f"Bearer {token}"},
    ).get_json()
    assert len(first_history) == 1
    assert len(second_history) == 1
    assert first_history[0]["question"] != second_history[0]["question"]
