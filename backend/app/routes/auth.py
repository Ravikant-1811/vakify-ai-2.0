import secrets

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import LearningStyle, PracticeActivity, RewardWallet, User, UserProfile, UserStreak, WeeklyQuizAttempt
from app.services.admin_auth import get_role_for_email, is_admin_email
from app.services.user_cleanup import delete_user_with_related_data


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _ensure_wallet(user_id: int) -> RewardWallet:
    wallet = db.session.get(RewardWallet, user_id)
    if not wallet:
        wallet = RewardWallet(user_id=user_id, current_xp=0, level=1, reward_points=0)
        db.session.add(wallet)
    return wallet


def _ensure_streak(user_id: int) -> UserStreak:
    streak = db.session.get(UserStreak, user_id)
    if not streak:
        streak = UserStreak(user_id=user_id, current_streak=0, longest_streak=0, last_active_date=None)
        db.session.add(streak)
    return streak


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
    return profile


def _progress_summary(user_id: int) -> dict:
    wallet = _ensure_wallet(user_id)
    streak = _ensure_streak(user_id)
    profile = db.session.get(UserProfile, user_id)
    style = db.session.get(LearningStyle, user_id)

    attempts = WeeklyQuizAttempt.query.filter_by(user_id=user_id).all()
    practice_rows = PracticeActivity.query.filter_by(user_id=user_id).all()
    completed_practice = [row for row in practice_rows if (row.status or "").lower() == "completed"]

    quiz_accuracy = 0.0
    if attempts:
        quiz_accuracy = sum(float(row.percentage or 0) for row in attempts) / len(attempts)
    practice_accuracy = 0.0
    if practice_rows:
        practice_accuracy = (len(completed_practice) / len(practice_rows)) * 100

    accuracy = round(min(100.0, max(quiz_accuracy, practice_accuracy)), 2)
    onboarded = bool(style)

    preferred_language = None
    weak_topics = []
    learning_level = "beginner"
    if profile:
        learning_level = profile.difficulty_level or "beginner"
        preferred_languages = profile.preferred_languages or []
        if isinstance(preferred_languages, list) and preferred_languages:
            preferred_language = preferred_languages[0]
        mastery = profile.topic_mastery_json or {}
        raw_topics = mastery.get("weak_topics") if isinstance(mastery, dict) else None
        if isinstance(raw_topics, list):
            weak_topics = [str(item) for item in raw_topics if str(item).strip()][:12]

    return {
        "xp": wallet.current_xp,
        "level": wallet.level,
        "reward_points": wallet.reward_points,
        "streak": streak.current_streak,
        "accuracy": accuracy,
        "onboarded": onboarded,
        "learningLevel": learning_level.capitalize() if learning_level else "Beginner",
        "preferredLanguage": preferred_language,
        "weakTopics": weak_topics,
    }


def _serialize_user(user: User) -> dict:
    summary = _progress_summary(user.user_id)
    return {
        "id": str(user.user_id),
        "email": user.email,
        "displayName": user.name,
        "avatar": None,
        "role": get_role_for_email(user.email),
        "xp": summary["xp"],
        "level": summary["level"],
        "streak": summary["streak"],
        "accuracy": summary["accuracy"],
        "learningLevel": summary["learningLevel"],
        "preferredLanguage": summary["preferredLanguage"],
        "weakTopics": summary["weakTopics"],
        "onboarded": summary["onboarded"],
    }


def _touch_profile(user_id: int, data: dict) -> None:
    profile = _ensure_profile(user_id)

    if "learning_level" in data:
        learning_level = str(data.get("learning_level", "")).strip().lower()
        if learning_level:
            profile.difficulty_level = learning_level

    if "preferred_language" in data:
        preferred_language = str(data.get("preferred_language", "")).strip()
        if preferred_language:
            profile.preferred_languages = [preferred_language]

    weight_fields = ("visual_weight", "auditory_weight", "kinesthetic_weight")
    if any(field in data for field in weight_fields):
        for field in weight_fields:
            if field in data:
                try:
                    setattr(profile, field, float(data.get(field, getattr(profile, field))))
                except (TypeError, ValueError):
                    pass

    if "weak_topics" in data:
        weak_topics = data.get("weak_topics", [])
        if isinstance(weak_topics, list):
            clean_topics = [str(item).strip() for item in weak_topics if str(item).strip()]
            profile.topic_mastery_json = {"weak_topics": clean_topics}

    db.session.commit()


def _issue_token(user: User) -> str:
    return create_access_token(identity=str(user.user_id))


def _find_or_create_user(email: str, name: str, password: str | None) -> User:
    user = User.query.filter_by(email=email).first()
    if not user:
        if password is None:
            password = secrets.token_urlsafe(32)
        user = User(
            name=name,
            email=email,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.flush()
        _ensure_wallet(user.user_id)
        _ensure_streak(user.user_id)
        _ensure_profile(user.user_id)
        db.session.commit()
        return user
    return user


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    name = str(data.get("display_name", "")).strip() or str(data.get("name", "")).strip() or "Learner"

    if not email:
        return jsonify({"error": "email is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "email already exists"}), 409

    user = _find_or_create_user(email=email, name=name, password=password)
    token = _issue_token(user)
    return jsonify({"access_token": token, "user": _serialize_user(user)})


@auth_bp.post("/clerk-login")
def clerk_login():
    data = request.get_json() or {}
    email = str(data.get("email", "")).strip().lower()
    name = str(data.get("name", "")).strip() or "Learner"

    if not email:
        return jsonify({"error": "email is required"}), 400

    user = _find_or_create_user(email=email, name=name, password=None)
    if name and user.name != name:
        user.name = name
        db.session.commit()

    token = _issue_token(user)
    return jsonify({"access_token": token, "user": _serialize_user(user)})


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    token = _issue_token(user)
    return jsonify({"access_token": token, "user": _serialize_user(user)})


@auth_bp.post("/login-user")
def login_user():
    return login()


@auth_bp.post("/login-admin")
def login_admin():
    return login()


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    payload = _serialize_user(user)
    payload["user_id"] = user.user_id
    payload["name"] = user.name
    payload["is_admin"] = is_admin_email(user.email)
    return jsonify(payload)


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    data = request.get_json() or {}
    if "name" in data:
        name = str(data.get("name", "")).strip()
        if not name:
            return jsonify({"error": "name cannot be empty"}), 400
        user.name = name

    if "email" in data:
        email = str(data.get("email", "")).strip().lower()
        if not email:
            return jsonify({"error": "email cannot be empty"}), 400
        existing = User.query.filter(User.email == email, User.user_id != user_id).first()
        if existing:
            return jsonify({"error": "email already exists"}), 409
        user.email = email

    if "password" in data:
        password = str(data.get("password", ""))
        if len(password) < 6:
            return jsonify({"error": "password must be at least 6 characters"}), 400
        user.password_hash = generate_password_hash(password)

    profile_updates = {}
    for field in ("learning_level", "preferred_language", "visual_weight", "auditory_weight", "kinesthetic_weight", "weak_topics"):
        if field in data:
            profile_updates[field] = data[field]
    if profile_updates:
        _touch_profile(user_id, profile_updates)

    db.session.commit()
    return jsonify(
        {
            "message": "profile updated",
            "user": _serialize_user(user),
        }
    )


@auth_bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"message": "logout successful on client token removal"})


@auth_bp.delete("/me")
@jwt_required()
def delete_me():
    user_id = int(get_jwt_identity())
    deleted = delete_user_with_related_data(user_id)
    if not deleted:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"message": "account deleted"})


@auth_bp.post("/forgot-password")
def forgot_password():
    return jsonify({"error": "password reset moved to Clerk."}), 410


@auth_bp.post("/reset-password")
def reset_password():
    return jsonify({"error": "password reset moved to Clerk."}), 410
