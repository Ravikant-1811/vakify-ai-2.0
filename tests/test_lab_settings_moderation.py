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

    from app.routes import lab as lab_routes

    monkeypatch.setattr(
        lab_routes,
        "generate_lab_task_from_chat",
        lambda question, answer, language: {
            "task_key": "python-recursion-practice",
            "language": "python",
            "title": "Recursion Practice",
            "description": "Write a tiny program inspired by the latest chat.",
            "starter_code": (
                "def solve(text):\n"
                "    return text.strip()\n"
                "\n"
                "if __name__ == '__main__':\n"
                "    import sys\n"
                "    print(solve(sys.stdin.read()))\n"
            ),
            "sample_input": "5\n",
            "expected_output": "5",
            "hint": "Read from stdin and print the cleaned result.",
            "validation_json": ["stdin", "print", "strip"],
        },
    )

    style = client.post(
        "/api/style/select",
        headers={"Authorization": f"Bearer {token}"},
        json={"learning_style": "visual"},
    )
    assert style.status_code == 200

    chat = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "question": "Explain recursion simply",
            "mode": "detailed",
        },
    )
    assert chat.status_code == 200

    task = client.get(
        "/api/lab/task?language=python",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert task.status_code == 200
    task_data = task.get_json()
    assert task_data["language"] == "python"
    assert task_data["task_id"] is None
    assert task_data["source_chat_id"] is None

    synced = client.post(
        "/api/lab/task/sync",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "language": "python",
            "chat_id": chat.get_json()["chat_id"],
        },
    )
    assert synced.status_code == 200
    synced_task = synced.get_json()
    assert synced_task["source_chat_id"] == chat.get_json()["chat_id"]
    assert synced_task["title"] == "Recursion Practice"

    run = client.post(
        "/api/lab/run",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "language": "python",
            "task_id": synced_task["task_id"],
            "challenge_key": synced_task["task_key"],
            "title": synced_task["title"],
            "source_code": synced_task["starter_code"],
            "stdin": synced_task["sample_input"],
        },
    )
    assert run.status_code == 200
    data = run.get_json()
    assert "stdout" in data
    assert data["submission_id"]
    assert isinstance(data["tests"], list)
    assert data["passed_tests"] >= 1

    submissions = client.get(
        "/api/lab/submissions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert submissions.status_code == 200
    rows = submissions.get_json()["rows"]
    assert rows[0]["task_id"] == synced_task["task_id"]


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
