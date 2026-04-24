from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc, func

from app.extensions import db
from app.models import (
    DailyTask,
    DailyTaskAttempt,
    RewardWallet,
    User,
    UserProfile,
    UserStreak,
    WeeklyQuiz,
    WeeklyQuizAttempt,
    XPEvent,
)


progression_bp = Blueprint("progression", __name__, url_prefix="/api")


def _week_bounds(today: date) -> tuple[date, date]:
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    return start, end


def _week_key(day: date) -> str:
    y, w, _ = day.isocalendar()
    return f"{y}-W{w:02d}"


def _ensure_profile(user_id: int) -> UserProfile:
    with db.session.no_autoflush:
        profile = db.session.get(UserProfile, user_id)
        if not profile:
            profile = UserProfile(
                user_id=user_id,
                difficulty_level="beginner",
                topic_mastery_json={},
                preferred_languages=["python", "java"],
            )
            db.session.add(profile)
    return profile


def _ensure_wallet(user_id: int) -> RewardWallet:
    with db.session.no_autoflush:
        wallet = db.session.get(RewardWallet, user_id)
        if not wallet:
            wallet = RewardWallet(user_id=user_id, current_xp=0, level=1, reward_points=0)
            db.session.add(wallet)
    return wallet


def _ensure_streak(user_id: int) -> UserStreak:
    with db.session.no_autoflush:
        streak = db.session.get(UserStreak, user_id)
        if not streak:
            streak = UserStreak(user_id=user_id, current_streak=0, longest_streak=0, last_active_date=None)
            db.session.add(streak)
    return streak


def _touch_streak(streak: UserStreak, active_day: date) -> None:
    if streak.last_active_date == active_day:
        return
    if streak.last_active_date == (active_day - timedelta(days=1)):
        streak.current_streak += 1
    else:
        streak.current_streak = 1
    streak.last_active_date = active_day
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak


def _award_xp(user_id: int, points: int, source: str, source_id: int | None = None, meta: dict | None = None) -> RewardWallet:
    wallet = _ensure_wallet(user_id)
    wallet.current_xp += max(0, points)
    wallet.reward_points += max(0, points)
    wallet.level = max(1, (wallet.current_xp // 200) + 1)
    row = XPEvent(
        user_id=user_id,
        source=source,
        source_id=source_id,
        points=max(0, points),
        meta=meta or {},
    )
    db.session.add(row)
    return wallet


def _default_daily_tasks(difficulty: str) -> list[dict]:
    return [
        {
            "title": "Concept Check: Explain OOP",
            "description": "In 6-8 lines, explain encapsulation, inheritance, polymorphism, and abstraction with one real example.",
            "task_type": "conceptual",
            "difficulty": difficulty,
            "points_reward": 20,
        },
        {
            "title": "Practice Task: Build a Palindrome Checker",
            "description": "Write a function in your preferred language to check if a string is palindrome. Include at least 3 test cases.",
            "task_type": "practical",
            "difficulty": difficulty,
            "points_reward": 25,
        },
    ]


def _default_weekly_quiz(difficulty: str) -> list[dict]:
    return [
        {
            "id": 1,
            "type": "mcq",
            "question": "Which OOP principle hides internal implementation details?",
            "options": ["Polymorphism", "Encapsulation", "Inheritance", "Recursion"],
            "answer": "Encapsulation",
        },
        {
            "id": 2,
            "type": "mcq",
            "question": "What is the average time complexity of binary search?",
            "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            "answer": "O(log n)",
        },
        {
            "id": 3,
            "type": "text",
            "question": "Name one practical use case of polymorphism in software design.",
            "answer": "open",
        },
        {
            "id": 4,
            "type": "mcq",
            "question": "Which data structure follows FIFO order?",
            "options": ["Stack", "Queue", "Tree", "Graph"],
            "answer": "Queue",
        },
        {
            "id": 5,
            "type": "text",
            "question": "Write one test case for palindrome checker with expected output.",
            "answer": "open",
        },
    ]


@progression_bp.get("/tasks/today")
@jwt_required()
def get_today_tasks():
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date()

    profile = _ensure_profile(user_id)
    rows = DailyTask.query.filter_by(user_id=user_id, due_date=today).order_by(DailyTask.task_id.asc()).all()

    if not rows:
        for task in _default_daily_tasks(profile.difficulty_level or "beginner"):
            db.session.add(
                DailyTask(
                    user_id=user_id,
                    title=task["title"],
                    description=task["description"],
                    task_type=task["task_type"],
                    difficulty=task["difficulty"],
                    points_reward=task["points_reward"],
                    due_date=today,
                    status="assigned",
                )
            )
        db.session.commit()
        rows = DailyTask.query.filter_by(user_id=user_id, due_date=today).order_by(DailyTask.task_id.asc()).all()
    else:
        db.session.commit()

    return jsonify(
        {
            "date": today.isoformat(),
            "tasks": [
                {
                    "task_id": r.task_id,
                    "title": r.title,
                    "description": r.description,
                    "task_type": r.task_type,
                    "difficulty": r.difficulty,
                    "status": r.status,
                    "points_reward": r.points_reward,
                }
                for r in rows
            ],
        }
    )


@progression_bp.post("/tasks/<int:task_id>/submit")
@jwt_required()
def submit_task(task_id: int):
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    submission_text = str(payload.get("submission", "")).strip()
    score = int(payload.get("score", 100))

    row = DailyTask.query.filter_by(task_id=task_id, user_id=user_id).first()
    if not row:
        return jsonify({"error": "task not found"}), 404

    was_completed = row.status == "completed"
    row.status = "completed"
    row.updated_at = datetime.utcnow()

    attempt = DailyTaskAttempt(
        task_id=row.task_id,
        user_id=user_id,
        submission_text=submission_text or None,
        score=max(0, min(score, 100)),
        status="completed",
    )
    db.session.add(attempt)

    wallet = _ensure_wallet(user_id)
    streak = _ensure_streak(user_id)

    awarded = 0
    if not was_completed:
        awarded = row.points_reward or 20
        wallet = _award_xp(
            user_id=user_id,
            points=awarded,
            source="daily_task",
            source_id=row.task_id,
            meta={"task_type": row.task_type, "difficulty": row.difficulty},
        )

    _touch_streak(streak, datetime.utcnow().date())
    db.session.commit()

    return jsonify(
        {
            "message": "task submitted",
            "task_id": row.task_id,
            "status": row.status,
            "xp_awarded": awarded,
            "wallet": {
                "current_xp": wallet.current_xp,
                "level": wallet.level,
                "reward_points": wallet.reward_points,
            },
            "streak": {
                "current_streak": streak.current_streak,
                "longest_streak": streak.longest_streak,
            },
        }
    )


@progression_bp.get("/quiz/weekly")
@jwt_required()
def get_weekly_quiz():
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date()
    week_start, week_end = _week_bounds(today)

    profile = _ensure_profile(user_id)
    with db.session.no_autoflush:
        quiz = WeeklyQuiz.query.filter_by(user_id=user_id, week_start=week_start).first()
        if not quiz:
            quiz = WeeklyQuiz(
                user_id=user_id,
                title=f"Weekly Adaptive Quiz ({_week_key(week_start)})",
                week_start=week_start,
                week_end=week_end,
                difficulty=profile.difficulty_level or "beginner",
                question_payload=_default_weekly_quiz(profile.difficulty_level or "beginner"),
            )
            db.session.add(quiz)

    db.session.commit()

    attempts = WeeklyQuizAttempt.query.filter_by(user_id=user_id, quiz_id=quiz.quiz_id).order_by(WeeklyQuizAttempt.created_at.desc()).all()
    best_score = max([a.percentage for a in attempts], default=0.0)

    return jsonify(
        {
            "quiz": {
                "quiz_id": quiz.quiz_id,
                "title": quiz.title,
                "week_start": quiz.week_start.isoformat(),
                "week_end": quiz.week_end.isoformat(),
                "difficulty": quiz.difficulty,
                "questions": quiz.question_payload,
            },
            "attempts": len(attempts),
            "best_score": round(best_score, 2),
        }
    )


@progression_bp.post("/quiz/<int:quiz_id>/submit")
@jwt_required()
def submit_weekly_quiz(quiz_id: int):
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    answers = payload.get("answers", {})

    quiz = WeeklyQuiz.query.filter_by(quiz_id=quiz_id, user_id=user_id).first()
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404

    questions = quiz.question_payload or []
    total = len(questions)
    if total == 0:
        return jsonify({"error": "quiz has no questions"}), 400

    score = 0
    normalized_answers = answers if isinstance(answers, dict) else {}

    for q in questions:
        qid = str(q.get("id"))
        correct = q.get("answer")
        user_answer = str(normalized_answers.get(qid, "")).strip()
        if correct == "open":
            if user_answer:
                score += 1
        elif user_answer.lower() == str(correct).strip().lower():
            score += 1

    percentage = (score / total) * 100

    attempt = WeeklyQuizAttempt(
        quiz_id=quiz.quiz_id,
        user_id=user_id,
        answers_payload=normalized_answers,
        score=score,
        total=total,
        percentage=percentage,
    )
    db.session.add(attempt)

    wallet = _ensure_wallet(user_id)
    streak = _ensure_streak(user_id)

    xp_awarded = 50 if percentage >= 80 else 30 if percentage >= 60 else 15
    wallet = _award_xp(
        user_id=user_id,
        points=xp_awarded,
        source="weekly_quiz",
        source_id=quiz.quiz_id,
        meta={"percentage": round(percentage, 2)},
    )
    _touch_streak(streak, datetime.utcnow().date())

    db.session.commit()

    return jsonify(
        {
            "message": "quiz submitted",
            "quiz_id": quiz.quiz_id,
            "score": score,
            "total": total,
            "percentage": round(percentage, 2),
            "xp_awarded": xp_awarded,
            "wallet": {
                "current_xp": wallet.current_xp,
                "level": wallet.level,
                "reward_points": wallet.reward_points,
            },
            "streak": {
                "current_streak": streak.current_streak,
                "longest_streak": streak.longest_streak,
            },
        }
    )


@progression_bp.get("/rewards/summary")
@jwt_required()
def rewards_summary():
    user_id = int(get_jwt_identity())
    wallet = _ensure_wallet(user_id)
    streak = _ensure_streak(user_id)
    db.session.commit()

    recent_events = (
        XPEvent.query.filter_by(user_id=user_id)
        .order_by(desc(XPEvent.created_at))
        .limit(20)
        .all()
    )

    return jsonify(
        {
            "wallet": {
                "current_xp": wallet.current_xp,
                "level": wallet.level,
                "reward_points": wallet.reward_points,
            },
            "streak": {
                "current_streak": streak.current_streak,
                "longest_streak": streak.longest_streak,
                "last_active_date": streak.last_active_date.isoformat() if streak.last_active_date else None,
            },
            "recent_xp_events": [
                {
                    "event_id": e.event_id,
                    "source": e.source,
                    "source_id": e.source_id,
                    "points": e.points,
                    "meta": e.meta,
                    "created_at": e.created_at.isoformat(),
                }
                for e in recent_events
            ],
        }
    )


@progression_bp.get("/leaderboard")
@jwt_required()
def leaderboard():
    user_id = int(get_jwt_identity())
    scope = (request.args.get("scope") or "weekly").strip().lower()
    if scope not in {"weekly", "all_time"}:
        return jsonify({"error": "scope must be weekly or all_time"}), 400

    query = db.session.query(
        XPEvent.user_id,
        func.sum(XPEvent.points).label("score"),
    )

    if scope == "weekly":
        week_start, _ = _week_bounds(datetime.utcnow().date())
        query = query.filter(XPEvent.created_at >= datetime.combine(week_start, datetime.min.time()))

    rows = (
        query.group_by(XPEvent.user_id)
        .order_by(desc("score"), XPEvent.user_id.asc())
        .limit(50)
        .all()
    )

    ranked = []
    my_rank = None
    my_score = 0

    for idx, row in enumerate(rows, start=1):
        user = User.query.get(row.user_id)
        score = int(row.score or 0)
        item = {
            "rank": idx,
            "user_id": row.user_id,
            "name": user.name if user else f"User {row.user_id}",
            "score": score,
        }
        ranked.append(item)
        if row.user_id == user_id:
            my_rank = idx
            my_score = score

    if my_rank is None:
        score_query = db.session.query(func.sum(XPEvent.points)).filter(XPEvent.user_id == user_id)
        if scope == "weekly":
            week_start, _ = _week_bounds(datetime.utcnow().date())
            score_query = score_query.filter(XPEvent.created_at >= datetime.combine(week_start, datetime.min.time()))
        my_score = int(score_query.scalar() or 0)

    return jsonify(
        {
            "scope": scope,
            "rows": ranked,
            "me": {
                "user_id": user_id,
                "rank": my_rank,
                "score": my_score,
            },
        }
    )
