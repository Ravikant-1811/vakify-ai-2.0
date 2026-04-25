from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import ChatHistory, ChatThreadMessage, CodeLabSubmission, CodeLabTask
from app.services.code_lab_service import (
    generate_lab_task_from_chat,
    get_challenge,
    list_challenges,
    run_code,
)


lab_bp = Blueprint("lab", __name__, url_prefix="/api/lab")


def _serialize_task(task: CodeLabTask) -> dict:
    return {
        "task_id": task.task_id,
        "user_id": task.user_id,
        "language": task.language,
        "task_key": task.task_key,
        "title": task.title,
        "description": task.description,
        "starter_code": task.starter_code,
        "sample_input": task.sample_input or "",
        "expected_output": task.expected_output or "",
        "hint": task.hint or "",
        "source_chat_id": task.source_chat_id,
        "source_thread_id": task.source_thread_id,
        "source_question": task.source_question,
        "source_answer": task.source_answer,
        "validation_json": task.validation_json or [],
        "is_active": task.is_active,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


def _latest_chat_for_user(user_id: int) -> ChatHistory | None:
    return ChatHistory.query.filter_by(user_id=user_id).order_by(ChatHistory.timestamp.desc()).first()


def _latest_thread_id_for_chat(chat_id: int, user_id: int) -> int | None:
    row = ChatThreadMessage.query.filter_by(chat_id=chat_id, user_id=user_id).first()
    return row.thread_id if row else None


def _build_validation_tests(task: CodeLabTask | None, result: dict, source_code: str) -> list[dict]:
    normalized = (source_code or "").lower()
    tests = [
        {"name": "Program compiled or executed", "passed": result.get("status") == "success"},
    ]

    if task:
        expected = (task.expected_output or "").strip()
        if expected:
            stdout = (result.get("stdout") or "").strip()
            tests.append(
                {
                    "name": "Matches sample output",
                    "passed": expected == stdout or expected in stdout,
                }
            )
        validations = [str(item).strip().lower() for item in (task.validation_json or []) if str(item).strip()]
        for item in validations[:3]:
            tests.append(
                {
                    "name": f"Uses {item}",
                    "passed": item in normalized,
                }
            )
        if task.hint:
            tests.append(
                {
                    "name": "Hint-related concept present",
                    "passed": any(word in normalized for word in task.hint.lower().split()[:3]),
                }
            )
    else:
        tests.extend(
            [
                {"name": "Task available", "passed": False},
                {"name": "Expected output matched", "passed": False},
                {"name": "Validation tags matched", "passed": False},
            ]
        )

    while len(tests) < 4:
        tests.append({"name": f"Check {len(tests) + 1}", "passed": False})
    return tests[:4]


def _current_or_generated_task(user_id: int, language: str, force_refresh: bool = False) -> CodeLabTask:
    language_key = (language or "python").strip().lower()
    if language_key in {"js", "javascript", "node"}:
        language_key = "javascript"
    elif language_key == "cpp":
        language_key = "c++"
    elif language_key not in {"python", "javascript", "java", "c", "c++"}:
        language_key = "python"

    latest_chat = _latest_chat_for_user(user_id)
    latest_thread_id = _latest_thread_id_for_chat(latest_chat.chat_id, user_id) if latest_chat else None
    existing = (
        CodeLabTask.query.filter_by(user_id=user_id, language=language_key, is_active=True)
        .order_by(CodeLabTask.updated_at.desc())
        .first()
    )
    if (
        existing
        and not force_refresh
        and (
            existing.source_chat_id == (latest_chat.chat_id if latest_chat else None)
            or latest_chat is None
        )
    ):
        return existing

    if latest_chat:
        generated = generate_lab_task_from_chat(latest_chat.question, latest_chat.response, language_key)
        task = CodeLabTask(
            user_id=user_id,
            language=generated["language"],
            task_key=generated["task_key"],
            title=generated["title"],
            description=generated["description"],
            starter_code=generated["starter_code"],
            sample_input=generated["sample_input"],
            expected_output=generated["expected_output"],
            hint=generated["hint"],
            source_chat_id=latest_chat.chat_id,
            source_thread_id=latest_thread_id,
            source_question=latest_chat.question,
            source_answer=latest_chat.response[:4000],
            validation_json=generated["validation_json"],
            is_active=True,
        )
    else:
        fallback = get_challenge(language_key)
        task = CodeLabTask(
            user_id=user_id,
            language=language_key,
            task_key=fallback["key"],
            title=fallback["title"],
            description=fallback["description"],
            starter_code=fallback["starter_code"],
            sample_input=fallback["sample_input"],
            expected_output=fallback["expected_output"],
            hint=fallback["hint"],
            source_chat_id=None,
            source_thread_id=None,
            source_question=None,
            source_answer=None,
            validation_json=["compile", "execute"],
            is_active=True,
        )

    if existing:
        existing.is_active = False
    db.session.add(task)
    db.session.commit()
    return task


@lab_bp.get("/challenges")
@jwt_required()
def challenges():
    return jsonify({"challenges": list_challenges()})


@lab_bp.get("/challenge")
@jwt_required()
def challenge():
    language = (request.args.get("language") or "python").strip().lower()
    return jsonify(get_challenge(language))


@lab_bp.get("/task")
@jwt_required()
def current_task():
    user_id = int(get_jwt_identity())
    language = (request.args.get("language") or "python").strip().lower()
    force_refresh = str(request.args.get("refresh", "")).strip().lower() in {"1", "true", "yes"}
    task = _current_or_generated_task(user_id, language, force_refresh=force_refresh)
    return jsonify(_serialize_task(task))


@lab_bp.post("/task/sync")
@jwt_required()
def sync_task_from_chat():
    user_id = int(get_jwt_identity())
    payload = request.get_json(silent=True) or {}
    language = str(payload.get("language", "python")).strip().lower()
    task = _current_or_generated_task(user_id, language, force_refresh=True)
    return jsonify(_serialize_task(task))


@lab_bp.post("/run")
@jwt_required()
def run():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    source_code = str(payload.get("source_code", "")).rstrip()
    language = str(payload.get("language", "python")).strip().lower()
    task_id = payload.get("task_id")
    try:
        task_id = int(task_id) if task_id not in {None, "", 0} else None
    except (TypeError, ValueError):
        return jsonify({"error": "task_id must be a number"}), 400
    challenge_key = str(payload.get("challenge_key", "")).strip()
    title = str(payload.get("title", "")).strip()
    stdin_text = str(payload.get("stdin", ""))

    if not source_code.strip():
        return jsonify({"error": "source_code is required"}), 400

    task = None
    if task_id is not None:
        task = CodeLabTask.query.filter_by(task_id=task_id, user_id=user_id).first()
        if not task:
            return jsonify({"error": "task not found"}), 404
        language = task.language
        challenge_key = challenge_key or task.task_key
        title = title or task.title
        if not stdin_text.strip():
            stdin_text = task.sample_input or ""

    if not challenge_key:
        challenge_key = get_challenge(language)["key"]
    if not title:
        title = task.title if task else get_challenge(language)["title"]

    result = run_code(language, source_code, stdin_text)
    tests = result.get("tests", [])
    passed_tests = sum(1 for item in tests if item.get("passed"))
    total_tests = len(tests)
    score = int(round((passed_tests / total_tests) * 100)) if total_tests else 0
    if task:
        tests = _build_validation_tests(task, result, source_code)
        passed_tests = sum(1 for item in tests if item.get("passed"))
        total_tests = len(tests)
        score = int(round((passed_tests / total_tests) * 100)) if total_tests else 0

    row = CodeLabSubmission(
        user_id=user_id,
        task_id=task.task_id if task else None,
        language=result.get("language", language),
        challenge_key=challenge_key,
        title=title,
        source_code=source_code,
        stdout=result.get("stdout", ""),
        stderr=result.get("stderr", ""),
        status=result.get("status", "error"),
        passed_tests=passed_tests,
        total_tests=total_tests,
        score=score,
    )
    db.session.add(row)
    db.session.commit()

    return jsonify(
        {
            **result,
            "submission_id": row.submission_id,
            "task": _serialize_task(task) if task else None,
            "passed_tests": passed_tests,
            "total_tests": total_tests,
            "score": score,
        }
    )


@lab_bp.get("/submissions")
@jwt_required()
def submissions():
    user_id = int(get_jwt_identity())
    rows = (
        CodeLabSubmission.query.filter_by(user_id=user_id)
        .order_by(CodeLabSubmission.created_at.desc())
        .limit(20)
        .all()
    )
    return jsonify(
        {
            "rows": [
                {
                    "submission_id": row.submission_id,
                    "task_id": row.task_id,
                    "language": row.language,
                    "challenge_key": row.challenge_key,
                    "title": row.title,
                    "status": row.status,
                    "score": row.score,
                    "passed_tests": row.passed_tests,
                    "total_tests": row.total_tests,
                    "stdout": row.stdout,
                    "stderr": row.stderr,
                    "created_at": row.created_at.isoformat(),
                }
                for row in rows
            ]
        }
    )
