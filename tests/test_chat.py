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
    from app.services import chatbot_service

    monkeypatch.setattr(chatbot_service, "chatgpt_text", lambda *args, **kwargs: "AI explanation for the topic.")
    monkeypatch.setattr(
        chatbot_service,
        "openai_json_schema",
        lambda *args, **kwargs: {
            "title": "Recursion Explained",
            "summary": "A clear explanation of recursion.",
            "answer": "Recursion is a function calling itself until a base case stops the loop.",
            "key_points": ["Have a base case", "Reduce the problem", "Trust the recursion"],
            "example": "Think of nested boxes where each box opens the next smaller box.",
            "code_sample": "def recurse(n):\n    if n == 0:\n        return\n    recurse(n-1)",
            "practice": "Write a function that prints numbers down to zero.",
            "quiz_question": "What stops recursion?",
            "quiz_options": ["Base case", "Loop", "Import", "Print"],
            "follow_up_prompts": ["Show me a Python example", "What is a base case?"],
            "next_step": "Try one small recursive function.",
            "confidence": "High",
            "mode": "detailed",
            "style": "visual",
        },
    )

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
    assert isinstance(rows[0]["response_json"], dict)
    assert rows[0]["response_json"]["answer"]
    assert rows[0]["response_json"]["summary"]
    assert rows[0]["response_json"]["key_points"]
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


def test_chat_image_generation_and_history(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)

    import app.routes.chat as chat_routes

    monkeypatch.setattr(chat_routes, "generate_image_data_url", lambda *args, **kwargs: "https://example.com/generated.png")

    register = client.post(
        "/api/auth/register",
        json={
            "email": "image@example.com",
            "password": "secret123",
            "display_name": "Image Learner",
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
        json={"title": "Image Chat"},
    )
    assert thread.status_code == 201
    thread_id = thread.get_json()["thread_id"]

    response = client.post(
        "/api/chat/image",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "prompt": "Create a simple diagram of a binary tree",
            "thread_id": thread_id,
        },
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["image_url"] == "https://example.com/generated.png"
    assert data["response_type"] == "visual"
    assert data["thread_id"] == thread_id
    assert data["chat_id"]

    history = client.get(
        f"/api/chat/history?thread_id={thread_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history.status_code == 200
    rows = history.get_json()
    assert len(rows) == 1
    assert rows[0]["response_json"]["image_url"] == "https://example.com/generated.png"
    assert rows[0]["response_json"]["mode"] == "image"


def test_chat_audio_generation_and_history(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)

    import app.routes.chat as chat_routes
    from app.services import chatbot_service

    monkeypatch.setattr(chatbot_service, "chatgpt_text", lambda *args, **kwargs: "AI explanation for the topic.")
    monkeypatch.setattr(
        chatbot_service,
        "openai_json_schema",
        lambda *args, **kwargs: {
            "title": "Audio Ready",
            "summary": "A short answer that can be converted to audio.",
            "answer": "This is the assistant answer that should become audio.",
            "key_points": ["One", "Two"],
            "follow_up_prompts": ["Repeat it", "Show me again"],
            "confidence": "High",
            "mode": "detailed",
            "style": "visual",
        },
    )
    monkeypatch.setattr(chat_routes, "create_download_file", lambda *args, **kwargs: str(tmp_path / "generated.mp3"))

    register = client.post(
        "/api/auth/register",
        json={
            "email": "audio@example.com",
            "password": "secret123",
            "display_name": "Audio Learner",
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
        json={"title": "Audio Chat"},
    )
    assert thread.status_code == 201
    thread_id = thread.get_json()["thread_id"]

    chat_response = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "question": "Explain audio generation",
            "mode": "detailed",
            "thread_id": thread_id,
        },
    )
    assert chat_response.status_code == 200
    chat_id = chat_response.get_json()["chat_id"]

    response = client.post(
        "/api/chat/audio",
        headers={"Authorization": f"Bearer {token}"},
        json={"chat_id": chat_id},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["audio_download_url"].endswith(".mp3") or data["audio_download_url"].startswith("/api/downloads/file/")
    assert data["chat_id"] == chat_id

    history = client.get(
        f"/api/chat/history?thread_id={thread_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history.status_code == 200
    rows = history.get_json()
    assert len(rows) == 1
    assert rows[0]["response_json"]["audio_download_url"]
    assert rows[0]["response_json"]["audio_download_id"]
