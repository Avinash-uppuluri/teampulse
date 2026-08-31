from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from authsvc.utils.responses import error


def token_required(fn):
    """Verifies a valid JWT is present. Use on every protected route."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return error("Missing or invalid authentication token.", 401)
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*allowed_roles):
    """
    Role-based authorization. The role is read from the JWT claim
    (set at login), never trusted from the frontend request body.

    Usage:
        @token_required
        @roles_required("ADMIN")
        def admin_only_view(): ...
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in allowed_roles:
                return error(
                    "You do not have permission to perform this action.", 403
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def current_user_id():
    return get_jwt_identity()


def current_user_role():
    return get_jwt().get("role")
