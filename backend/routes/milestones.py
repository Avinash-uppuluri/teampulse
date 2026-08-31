from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Project, Milestone, ProjectActivity
from models.milestone import MILESTONE_STATUSES
from utils.auth import require_auth, require_roles
from utils.helpers import error_response, parse_date, user_can_access_project

milestones_bp = Blueprint("milestones", __name__)


def _pm_owns_project_or_admin(user, project):
    if user["role"] == "ADMIN":
        return True
    return user["role"] == "PROJECT_MANAGER" and project.manager_id == user["id"]


# =====================================================================
# POST /api/projects/:id/milestones
# =====================================================================
@milestones_bp.route("/api/projects/<int:project_id>/milestones", methods=["POST"])
@require_roles("PROJECT_MANAGER")
def create_milestone(project_id):
    project = Project.query.get_or_404(project_id)
    user = g.current_user
    if not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage milestones on projects you own.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return error_response("`name` is required.")

    try:
        due_date = parse_date(data.get("due_date"))
    except ValueError as e:
        return error_response(str(e))

    status = data.get("status", "NOT_STARTED")
    if status not in MILESTONE_STATUSES:
        return error_response(f"Invalid status. Must be one of {MILESTONE_STATUSES}")

    progress = data.get("progress", 0)
    try:
        progress = int(progress)
    except (TypeError, ValueError):
        return error_response("`progress` must be an integer between 0 and 100.")
    if not (0 <= progress <= 100):
        return error_response("`progress` must be between 0 and 100.")

    milestone = Milestone(
        project_id=project_id,
        name=name,
        description=data.get("description"),
        due_date=due_date,
        status=status,
        progress=progress,
    )
    db.session.add(milestone)
    db.session.flush()

    ProjectActivity.log(project_id, user["id"], "MILESTONE_CREATED", f'Milestone "{name}" created')
    db.session.commit()

    return jsonify(milestone.to_dict()), 201


# =====================================================================
# GET /api/projects/:id/milestones
# =====================================================================
@milestones_bp.route("/api/projects/<int:project_id>/milestones", methods=["GET"])
@require_auth
def list_milestones(project_id):
    project = Project.query.get_or_404(project_id)
    if not user_can_access_project(g.current_user, project):
        return error_response("You do not have access to this project.", 403, "FORBIDDEN")

    milestones = (
        Milestone.query.filter_by(project_id=project_id)
        .order_by(Milestone.due_date.asc().nullslast())
        .all()
    )
    return jsonify([m.to_dict() for m in milestones])


# =====================================================================
# GET /api/milestones/:id
# =====================================================================
@milestones_bp.route("/api/milestones/<int:milestone_id>", methods=["GET"])
@require_auth
def get_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id)
    if not user_can_access_project(g.current_user, milestone.project):
        return error_response("You do not have access to this milestone.", 403, "FORBIDDEN")
    return jsonify(milestone.to_dict())


# =====================================================================
# PUT /api/milestones/:id
# =====================================================================
@milestones_bp.route("/api/milestones/<int:milestone_id>", methods=["PUT"])
@require_roles("PROJECT_MANAGER")
def update_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id)
    project = milestone.project
    user = g.current_user
    if not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage milestones on projects you own.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}

    if "name" in data and data["name"]:
        milestone.name = data["name"].strip()
    if "description" in data:
        milestone.description = data["description"]
    if "due_date" in data:
        try:
            milestone.due_date = parse_date(data["due_date"])
        except ValueError as e:
            return error_response(str(e))
    if "status" in data:
        if data["status"] not in MILESTONE_STATUSES:
            return error_response(f"Invalid status. Must be one of {MILESTONE_STATUSES}")
        milestone.status = data["status"]
        if data["status"] == "COMPLETED":
            milestone.progress = 100
    if "progress" in data:
        try:
            progress = int(data["progress"])
        except (TypeError, ValueError):
            return error_response("`progress` must be an integer between 0 and 100.")
        if not (0 <= progress <= 100):
            return error_response("`progress` must be between 0 and 100.")
        milestone.progress = progress

    ProjectActivity.log(
        project.id, user["id"], "MILESTONE_UPDATED",
        f'Milestone "{milestone.name}" updated (status={milestone.status}, progress={milestone.progress}%)'
    )
    db.session.commit()
    return jsonify(milestone.to_dict())


# =====================================================================
# DELETE /api/milestones/:id
# =====================================================================
@milestones_bp.route("/api/milestones/<int:milestone_id>", methods=["DELETE"])
@require_roles("PROJECT_MANAGER")
def delete_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id)
    project = milestone.project
    user = g.current_user
    if not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage milestones on projects you own.", 403, "FORBIDDEN")

    name = milestone.name
    db.session.delete(milestone)
    ProjectActivity.log(project.id, user["id"], "MILESTONE_DELETED", f'Milestone "{name}" deleted')
    db.session.commit()
    return jsonify({"message": "Milestone deleted."}), 200
