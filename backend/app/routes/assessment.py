from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request

from app.extensions import db
from app.models import LearningStyle, OnboardingAssessment, UserProfile
from app.services.assessment_service import get_assessment_questions, normalize_language, score_assessment


assessment_bp = Blueprint("assessment", __name__, url_prefix="/api/assessment")


def _ensure_profile(user_id: int) -> UserProfile:
    profile = db.session.get(UserProfile, user_id)
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            difficulty_level="beginner",
            topic_mastery_json={},
            preferred_languages=[],
        )
        db.session.add(profile)
        db.session.flush()
    return profile


@assessment_bp.get("/questions")
def assessment_questions():
    language = normalize_language(request.args.get("language"))
    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        raw_identity = get_jwt_identity()
        user_id = int(raw_identity) if raw_identity is not None else None
    except Exception:
        user_id = None

    if user_id is not None:
        assessment = OnboardingAssessment.query.filter_by(user_id=user_id).first()
        if assessment and assessment.preferred_language == language:
            return jsonify(
                {
                    "language": assessment.preferred_language,
                    "questions": [
                        {
                            "id": item["id"],
                            "prompt": item["prompt"],
                            "options": item["options"],
                            "topic": item["topic"],
                        }
                        for item in assessment.questions_json
                    ],
                    "total_questions": assessment.total_questions,
                    "saved": True,
                }
            )

    questions = get_assessment_questions(language)
    return jsonify(
        {
            "language": language,
            "questions": questions,
            "total_questions": len(questions),
            "saved": False,
        }
    )


@assessment_bp.post("/submit")
@jwt_required()
def submit_assessment():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    language = normalize_language(payload.get("preferred_language"))
    answers = payload.get("answers", {})
    if not isinstance(answers, dict):
        return jsonify({"error": "answers must be an object"}), 400

    questions = get_assessment_questions(language)
    scoring = score_assessment(language, answers)
    profile = _ensure_profile(user_id)
    profile.difficulty_level = scoring["recommended_level"]
    profile.preferred_languages = [language]
    profile.topic_mastery_json = {
        "weak_topics": scoring["weak_topics"],
        "assessment": {
            "language": language,
            "percentage": scoring["percentage"],
            "correct": scoring["correct"],
            "total": scoring["total"],
        },
    }

    record = db.session.get(OnboardingAssessment, user_id)
    if not record:
        record = OnboardingAssessment(
            user_id=user_id,
            preferred_language=language,
            total_questions=scoring["total"],
            correct_answers=scoring["correct"],
            percentage=scoring["percentage"],
            recommended_level=scoring["recommended_level"],
            questions_json=questions,
            answers_json=answers,
            weak_topics_json=scoring["weak_topics"],
        )
        db.session.add(record)
    else:
        record.preferred_language = language
        record.total_questions = scoring["total"]
        record.correct_answers = scoring["correct"]
        record.percentage = scoring["percentage"]
        record.recommended_level = scoring["recommended_level"]
        record.questions_json = questions
        record.answers_json = answers
        record.weak_topics_json = scoring["weak_topics"]

    style = db.session.get(LearningStyle, user_id)
    if style and not style.learning_style:
        style.learning_style = "visual"
    db.session.commit()

    return jsonify(
        {
            "message": "assessment saved",
            "assessment": {
                "language": language,
                "score": scoring["correct"],
                "total": scoring["total"],
                "percentage": scoring["percentage"],
                "recommended_level": scoring["recommended_level"],
                "weak_topics": scoring["weak_topics"],
            },
        }
    )
