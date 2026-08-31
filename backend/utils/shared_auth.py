"""
Shared auth decorators for Part 3 and Part 4 routes.

FIXES ON MERGE:
Part 3's original `auth_utils.py` and Part 4's original `auth.py` each
hand-rolled their own PyJWT decoding and expected a `user_id` claim.
Part 1 (the actual token issuer) uses Flask-JWT-Extended, which puts the
user id in the standard `sub` claim -- so both modules' `g.user_id` /
`g.current_user["user_id"]` were always None against a real Part 1 token.
This module decodes tokens the same way Part 1/Part 2 already do, and
exposes the same `login_required` / `roles_required` decorator names and
`g.current_user` shape Part 3's routes expect, and the same `g.user_id` /
`g.role` shape Part 4's routes expect, so neither route file needs to
change its call sites.

Part 3 and Part 4 also used inconsistent legacy role strings ("QA",
"LEAD") where Part 1's canonical roles are "QA_TESTER" and "TEAM_LEAD"
(see authsvc/models/user.py::ALLOWED_ROLES). ROLE_ALIASES below maps the
legacy strings so existing @roles_required("QA", "LEAD", ...) call sites
across Part 3/4 keep working without editing every route.
"""

from functools import wraps

from flask import g, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request

ROLE_ALIASES = {
    "LEAD": "TEAM_LEAD",
    "QA": "QA_TESTER",
}


def _canonical_role(role):
    return ROLE_ALIASES.get(role, role)


def login_required(fn):
    """Part-3-style decorator: sets g.current_user = {user_id, role, email}."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception:
            return jsonify({"error": "Missing or invalid authentication token."}), 401

        claims = get_jwt()
        g.current_user = {
            "user_id": int(get_jwt_identity()),
            "role": _canonical_role(claims.get("role")),
            "email": claims.get("email"),
        }
        # Part-4-style flat attributes, for routes/files copied from Part 4.
        g.user_id = g.current_user["user_id"]
        g.role = g.current_user["role"]
        return fn(*args, **kwargs)

    return wrapper


def roles_required(*allowed_roles):
    """Works for both Part 3 (g.current_user['role']) and Part 4 (g.role) call sites."""

    canonical_allowed = {_canonical_role(r) for r in allowed_roles}

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            role = getattr(g, "role", None) or (
                getattr(g, "current_user", {}) or {}
            ).get("role")
            if role not in canonical_allowed:
                return jsonify({"error": "Forbidden: insufficient role"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
