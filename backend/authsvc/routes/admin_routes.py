from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from authsvc.models.user import UserModel
from authsvc.services.user_service import UserService
from authsvc.middleware.auth_middleware import token_required, roles_required
from authsvc.utils.responses import success, error

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/stats", methods=["GET"])
@token_required
@roles_required("ADMIN")
def get_stats():
    from db_pool import get_connection

    stats = UserModel.get_stats()

    # total projects will come from Part 2's `projects` table once merged.
    # Kept at 0 here so the dashboard card renders without crashing pre-merge.
    total_projects = 0
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SHOW TABLES LIKE 'projects'")
        if cur.fetchone():
            cur.execute("SELECT COUNT(*) AS c FROM projects")
            total_projects = cur.fetchone()["c"]
        cur.close()
        conn.close()
    except Exception:
        pass

    return success(
        {
            "total_users": stats["total_users"] or 0,
            "active_users": stats["active_users"] or 0,
            "inactive_users": stats["inactive_users"] or 0,
            "total_projects": total_projects,
            "project_managers": stats["project_managers"] or 0,
            "team_leads": stats["team_leads"] or 0,
            "developers": stats["developers"] or 0,
            "qa_testers": stats["qa_testers"] or 0,
            "clients": stats["clients"] or 0,
        }
    )


@admin_bp.route("/users", methods=["GET"])
@token_required
@roles_required("ADMIN")
def list_users():
    search = request.args.get("search")
    role = request.args.get("role")
    status = request.args.get("status")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))

    users, total = UserModel.list_users(search, role, status, page, per_page)
    return success(
        {
            "users": users,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page if per_page else 1,
            },
        }
    )


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@token_required
@roles_required("ADMIN")
def get_user(user_id):
    user = UserModel.find_by_id(user_id)
    if not user:
        return error("User not found.", 404)
    return success(user)


@admin_bp.route("/users", methods=["POST"])
@token_required
@roles_required("ADMIN")
def create_user():
    body = request.get_json(silent=True) or {}
    user, err_msg = UserService.create_user(
        name=body.get("name"),
        email=body.get("email"),
        password=body.get("password"),
        role=body.get("role"),
        department=body.get("department"),
    )
    if err_msg:
        return error(err_msg, 400)
    return success(user, "User created successfully.", 201)


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@token_required
@roles_required("ADMIN")
def update_user(user_id):
    body = request.get_json(silent=True) or {}
    ok, err_msg = UserService.update_user(user_id, body)
    if not ok:
        return error(err_msg, 400)
    return success(UserModel.find_by_id(user_id), "User updated successfully.")


@admin_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@token_required
@roles_required("ADMIN")
def update_status(user_id):
    body = request.get_json(silent=True) or {}
    ok, err_msg = UserService.set_status(user_id, body.get("status"))
    if not ok:
        return error(err_msg, 400)
    return success(UserModel.find_by_id(user_id), "User status updated.")


@admin_bp.route("/users/<int:user_id>/reset-password", methods=["PATCH"])
@token_required
@roles_required("ADMIN")
def reset_password(user_id):
    body = request.get_json(silent=True) or {}
    ok, err_msg = UserService.reset_password(user_id, body.get("password"))
    if not ok:
        return error(err_msg, 400)
    return success(message="Password reset successfully.")


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@token_required
@roles_required("ADMIN")
def delete_user(user_id):
    requesting_admin_id = get_jwt_identity()
    ok, err_msg = UserService.delete_user(user_id, requesting_admin_id)
    if not ok:
        return error(err_msg, 400)
    return success(message="User deleted successfully.")
