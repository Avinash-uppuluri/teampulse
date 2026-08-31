"""
Auth utilities for Part 2.

Part 1 owns login/token issuance. This module only VERIFIES tokens
(via flask-jwt-extended, configured with the same JWT_SECRET_KEY) and
exposes the decoded identity/claims to route handlers.

Expected JWT claims (as issued by Part 1):
{
  "sub": "<user_id>",           # flask-jwt-extended identity
  "role": "ADMIN" | "PROJECT_MANAGER" | "TEAM_LEAD" | "DEVELOPER" | "CLIENT",
  "name": "...",
  "email": "..."
}
"""

from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity


def get_current_user():
    """Returns {id, role, name, email} for the authenticated caller."""
    claims = get_jwt()
    return {
        "id": int(get_jwt_identity()),
        "role": claims.get("role"),
        "name": claims.get("name"),
        "email": claims.get("email"),
    }


def require_auth(fn):
    """Verifies a valid JWT is present; attaches user info to flask.g."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        g.current_user = get_current_user()
        return fn(*args, **kwargs)
    return wrapper


def require_roles(*allowed_roles):
    """
    Restricts an endpoint to a set of roles, e.g.:
        @require_roles("ADMIN", "PROJECT_MANAGER")
    ADMIN is always implicitly allowed unless explicitly excluded by
    passing only non-admin roles AND setting allow_admin=False is not
    supported here by design — admins have full visibility per the
    role hierarchy (ADMIN -> PROJECT MANAGER -> ...).
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = get_current_user()
            g.current_user = user
            if user["role"] == "ADMIN":
                return fn(*args, **kwargs)
            if user["role"] not in allowed_roles:
                return jsonify({
                    "error": "FORBIDDEN",
                    "message": "You do not have permission to perform this action."
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
