from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity

from authsvc.services.auth_service import AuthService
from authsvc.models.user import UserModel
from authsvc.middleware.auth_middleware import token_required
from authsvc.utils.responses import success, error
from authsvc.utils.validators import is_valid_email, sanitize_str

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    email = sanitize_str(body.get("email", "")).lower()
    password = body.get("password", "")

    if not is_valid_email(email) or not password:
        return error("Email and password are required.", 400)

    user, err_msg = AuthService.authenticate(email, password)
    if err_msg:
        # Generic message on purpose: never reveal whether the email exists.
        return error(err_msg, 401)

    token = AuthService.issue_token(user)

    return success(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "department": user["department"],
            },
        },
        "Login successful.",
    )


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    # Stateless JWT: logout is handled client-side by discarding the token.
    # (A denylist/refresh-token table can be added later if needed.)
    return success(message="Logged out successfully.")


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    user_id = get_jwt_identity()
    user = UserModel.find_by_id(user_id, public_only=True)
    if not user:
        return error("User not found.", 404)
    return success(user)
