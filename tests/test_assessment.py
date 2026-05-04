from app import create_app
from app.models import OnboardingAssessment, UserProfile


def _client(tmp_path, monkeypatch):
    db_path = tmp_path / "assessment-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "google-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "google-client-secret")
    monkeypatch.setenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback")
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


def test_assessment_questions_and_submission(tmp_path, monkeypatch):
    client = _client(tmp_path, monkeypatch)
    token = _register(client, "assessment@example.com", "Assessment Learner")

    questions = client.get(
        "/api/assessment/questions?language=python",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert questions.status_code == 200
    questions_data = questions.get_json()
    assert questions_data["language"] == "python"
    assert len(questions_data["questions"]) == 10

    answers = {question["id"]: 0 for question in questions_data["questions"]}
    submit = client.post(
        "/api/assessment/submit",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "preferred_language": "python",
            "answers": answers,
        },
    )
    assert submit.status_code == 200
    submit_data = submit.get_json()
    assert submit_data["assessment"]["score"] == 10
    assert submit_data["assessment"]["recommended_level"] == "advanced"

    app = client.application
    with app.app_context():
        assessment = OnboardingAssessment.query.first()
        profile = UserProfile.query.first()
        assert assessment is not None
        assert assessment.preferred_language == "python"
        assert profile is not None
        assert profile.difficulty_level == "advanced"
        assert profile.preferred_languages == ["python"]
