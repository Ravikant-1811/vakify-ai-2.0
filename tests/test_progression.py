from app import create_app
from app.extensions import db


def _client(tmp_path, monkeypatch):
    db_path = tmp_path / "progression-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("MODERATOR_EMAILS", "moderator@example.com")
    monkeypatch.setenv("ADMIN_EMAILS", "")
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


def test_language_aware_daily_and_weekly_progression(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    token = _register(client, "progression@example.com", "Progression Learner")

    profile_update = client.put(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "preferred_language": "python",
            "learning_level": "beginner",
        },
    )
    assert profile_update.status_code == 200

    today = client.get(
        "/api/tasks/today",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert today.status_code == 200
    today_data = today.get_json()
    assert today_data["preferred_language"] == "python"
    assert len(today_data["tasks"]) == 2

    code_task = next(task for task in today_data["tasks"] if task["task_type"] == "code")
    quiz_task = next(task for task in today_data["tasks"] if task["task_type"] == "quiz")
    assert code_task["content"]["mode"] == "code"
    assert quiz_task["content"]["mode"] == "quiz"
    assert len(quiz_task["content"]["questions"]) == 5

    quiz_answers = {
        str(question["id"]): question["answer"]
        for question in quiz_task["content"]["questions"]
    }
    quiz_submit = client.post(
        f"/api/tasks/{quiz_task['task_id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"answers": quiz_answers},
    )
    assert quiz_submit.status_code == 200
    quiz_result = quiz_submit.get_json()
    assert quiz_result["passed"] is True
    assert quiz_result["xp_awarded"] > 0

    code_submit = client.post(
        f"/api/tasks/{code_task['task_id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "submission": code_task["content"]["starter_code"],
            "score": 90,
        },
    )
    assert code_submit.status_code == 200
    code_result = code_submit.get_json()
    assert code_result["passed"] is True
    assert code_result["xp_awarded"] > 0

    weekly = client.get(
        "/api/quiz/weekly",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert weekly.status_code == 200
    weekly_data = weekly.get_json()
    assert weekly_data["quiz"]["language"] == "python"
    assert len(weekly_data["quiz"]["questions"]) == 7
    assert all("answer" in question for question in weekly_data["quiz"]["questions"])

    weekly_answers = {
        str(question["id"]): question["answer"]
        for question in weekly_data["quiz"]["questions"]
    }
    weekly_submit = client.post(
        f"/api/quiz/{weekly_data['quiz']['quiz_id']}/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={"answers": weekly_answers},
    )
    assert weekly_submit.status_code == 200
    weekly_result = weekly_submit.get_json()
    assert weekly_result["percentage"] == 100
    assert weekly_result["xp_awarded"] > 0

    rewards = client.get(
        "/api/rewards/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert rewards.status_code == 200
    rewards_data = rewards.get_json()
    assert rewards_data["wallet"]["reward_points"] >= quiz_result["xp_awarded"] + code_result["xp_awarded"] + weekly_result["xp_awarded"]


def test_training_workspace_persists_draft_and_run_state(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    token = _register(client, "workspace@example.com", "Workspace Learner")

    saved = client.put(
        "/api/lab/workspace",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "workspace_type": "training",
            "language": "python",
            "code": "print('hello from db')",
            "stdin": "12\n",
            "last_status": "draft",
        },
    )
    assert saved.status_code == 200

    loaded = client.get(
        "/api/lab/workspace?workspace_type=training&language=python",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert loaded.status_code == 200
    loaded_data = loaded.get_json()["workspace"]
    assert loaded_data["code"] == "print('hello from db')"
    assert loaded_data["stdin"] == "12\n"

    run = client.post(
        "/api/lab/run",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "language": "python",
            "source_code": "print('hello from db')",
            "stdin": "12\n",
        },
    )
    assert run.status_code == 200
    run_data = run.get_json()
    assert "stdout" in run_data

    persisted = client.get(
        "/api/lab/workspace?workspace_type=training&language=python",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert persisted.status_code == 200
    persisted_data = persisted.get_json()["workspace"]
    assert persisted_data["code"] == "print('hello from db')"
    assert persisted_data["stdin"] == "12\n"
    assert persisted_data["last_output"] != ""
