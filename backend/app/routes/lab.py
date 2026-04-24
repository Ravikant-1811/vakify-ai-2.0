from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import CodeLabSubmission
from app.services.code_lab_service import get_challenge, list_challenges, run_code


lab_bp = Blueprint("lab", __name__, url_prefix="/api/lab")


@lab_bp.get("/challenges")
@jwt_required()
def challenges():
    return jsonify({"challenges": list_challenges()})


@lab_bp.get("/challenge")
@jwt_required()
def challenge():
    language = (request.args.get("language") or "python").strip().lower()
    return jsonify(get_challenge(language))


@lab_bp.post("/run")
@jwt_required()
def run():
    user_id = int(get_jwt_identity())
    payload = request.get_json() or {}
    source_code = str(payload.get("source_code", "")).rstrip()
    language = str(payload.get("language", "python")).strip().lower()
    challenge_key = str(payload.get("challenge_key", "")).strip() or get_challenge(language)["key"]
    title = str(payload.get("title", "")).strip() or get_challenge(language)["title"]
    stdin_text = str(payload.get("stdin", ""))

    if not source_code.strip():
        return jsonify({"error": "source_code is required"}), 400

    result = run_code(language, source_code, stdin_text)
    tests = result.get("tests", [])
    passed_tests = sum(1 for item in tests if item.get("passed"))
    total_tests = len(tests)
    score = int(round((passed_tests / total_tests) * 100)) if total_tests else 0

    row = CodeLabSubmission(
        user_id=user_id,
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
