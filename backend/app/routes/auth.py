import secrets
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User
from app.services.admin_auth import is_admin_email
from app.services.user_cleanup import delete_user_with_related_data


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    return jsonify({"error": "password-based auth disabled. use Clerk sign-up."}), 410


@auth_bp.post("/clerk-login")
def clerk_login():
    data = request.get_json() or {}
    clerk_user_id = str(data.get("clerk_user_id", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    name = str(data.get("name", "")).strip() or "Learner"

    if not clerk_user_id or not email:
        return jsonify({"error": "clerk_user_id and email are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            # Stored only to satisfy legacy non-null schema while Clerk handles auth.
            password_hash=generate_password_hash(secrets.token_urlsafe(32)),
        )
        db.session.add(user)
        db.session.commit()
    else:
        if name and user.name != name:
            user.name = name
            db.session.commit()

    token = create_access_token(identity=str(user.user_id))
    return jsonify(
        {
            "access_token": token,
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "is_admin": is_admin_email(user.email),
                "clerk_user_id": clerk_user_id,
            },
        }
    )


@auth_bp.post("/login")
def login():
    return jsonify({"error": "password-based auth disabled. use Clerk sign-in."}), 410


@auth_bp.post("/login-user")
def login_user():
    return jsonify({"error": "password-based auth disabled. use Clerk sign-in."}), 410


@auth_bp.post("/login-admin")
def login_admin():
    return jsonify({"error": "admin password login disabled. use Clerk sign-in."}), 410


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    return jsonify(
        {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "is_admin": is_admin_email(user.email),
        }
    )


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
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

    db.session.commit()
    return jsonify(
        {
            "message": "profile updated",
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "is_admin": is_admin_email(user.email),
            },
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
