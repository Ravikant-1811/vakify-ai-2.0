from datetime import datetime, timedelta
import secrets
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LearningStyle(db.Model):
    __tablename__ = "learning_style"

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), primary_key=True)
    learning_style = db.Column(db.String(20), nullable=False)  # visual/auditory/kinesthetic
    visual_score = db.Column(db.Integer, default=0, nullable=False)
    auditory_score = db.Column(db.Integer, default=0, nullable=False)
    kinesthetic_score = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ChatHistory(db.Model):
    __tablename__ = "chat_history"

    chat_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    question = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    response_type = db.Column(db.String(20), nullable=False)
    learning_style_used = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class ChatFeedback(db.Model):
    __tablename__ = "chat_feedback"

    feedback_id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat_history.chat_id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)  # 1 helpful, -1 needs work
    comment = db.Column(db.String(600), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PracticeActivity(db.Model):
    __tablename__ = "practice_activity"

    activity_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    task_name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(40), default="started", nullable=False)
    code_submitted = db.Column(db.Text, nullable=True)
    time_spent = db.Column(db.Integer, default=0, nullable=False)  # seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Download(db.Model):
    __tablename__ = "downloads"

    download_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    content_type = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    token = db.Column(db.String(128), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @staticmethod
    def create_for_user(user_id: int, ttl_minutes: int = 30) -> "PasswordResetToken":
        return PasswordResetToken(
            token=secrets.token_urlsafe(48),
            user_id=user_id,
            expires_at=datetime.utcnow() + timedelta(minutes=max(5, ttl_minutes)),
            used=False,
        )


class UserProfile(db.Model):
    __tablename__ = "user_profile"

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), primary_key=True)
    difficulty_level = db.Column(db.String(20), default="beginner", nullable=False)
    topic_mastery_json = db.Column(db.JSON, nullable=True)
    preferred_languages = db.Column(db.JSON, nullable=True)
    visual_weight = db.Column(db.Float, default=0.33, nullable=False)
    auditory_weight = db.Column(db.Float, default=0.33, nullable=False)
    kinesthetic_weight = db.Column(db.Float, default=0.34, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DailyTask(db.Model):
    __tablename__ = "daily_tasks"

    task_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    task_type = db.Column(db.String(20), default="conceptual", nullable=False)
    difficulty = db.Column(db.String(20), default="beginner", nullable=False)
    status = db.Column(db.String(20), default="assigned", nullable=False)
    points_reward = db.Column(db.Integer, default=20, nullable=False)
    due_date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class DailyTaskAttempt(db.Model):
    __tablename__ = "daily_task_attempts"

    attempt_id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("daily_tasks.task_id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    submission_text = db.Column(db.Text, nullable=True)
    score = db.Column(db.Integer, default=0, nullable=False)
    status = db.Column(db.String(20), default="submitted", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class WeeklyQuiz(db.Model):
    __tablename__ = "weekly_quizzes"

    quiz_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    week_start = db.Column(db.Date, nullable=False, index=True)
    week_end = db.Column(db.Date, nullable=False, index=True)
    difficulty = db.Column(db.String(20), default="beginner", nullable=False)
    question_payload = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class WeeklyQuizAttempt(db.Model):
    __tablename__ = "weekly_quiz_attempts"

    attempt_id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("weekly_quizzes.quiz_id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    answers_payload = db.Column(db.JSON, nullable=False)
    score = db.Column(db.Integer, default=0, nullable=False)
    total = db.Column(db.Integer, default=0, nullable=False)
    percentage = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class RewardWallet(db.Model):
    __tablename__ = "reward_wallet"

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), primary_key=True)
    current_xp = db.Column(db.Integer, default=0, nullable=False)
    level = db.Column(db.Integer, default=1, nullable=False)
    reward_points = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class XPEvent(db.Model):
    __tablename__ = "xp_events"

    event_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    source = db.Column(db.String(40), nullable=False)
    source_id = db.Column(db.Integer, nullable=True)
    points = db.Column(db.Integer, nullable=False)
    meta = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)


class UserStreak(db.Model):
    __tablename__ = "user_streaks"

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), primary_key=True)
    current_streak = db.Column(db.Integer, default=0, nullable=False)
    longest_streak = db.Column(db.Integer, default=0, nullable=False)
    last_active_date = db.Column(db.Date, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class LeaderboardSnapshot(db.Model):
    __tablename__ = "leaderboard_snapshots"

    snapshot_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    scope = db.Column(db.String(20), nullable=False, index=True)  # weekly, all_time
    week_key = db.Column(db.String(10), nullable=True, index=True)  # e.g. 2026-W15
    rank = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
