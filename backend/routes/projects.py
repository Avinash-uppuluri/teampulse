from datetime import date, timedelta
from flask import Blueprint, request, jsonify, g
from sqlalchemy import or_

from extensions import db
from models import Project, Team, TeamMember, Milestone, ProjectActivity
from models.project import PROJECT_STATUSES, PROJECT_HEALTH, PROJECT_PRIORITIES
from utils.auth import require_auth, require_roles
from utils.helpers import (
    error_response, parse_date, paginate_query,
    user_can_access_project, scope_projects_query,
)

projects_bp = Blueprint("projects", __name__)


# =====================================================================
# POST /api/projects
# =====================================================================
@projects_bp.route("/api/projects", methods=["POST"])
@require_roles("PROJECT_MANAGER")
def create_project():
    data = request.get_json(force=True, silent=True) or {}
    user = g.current_user

    name = (data.get("name") or "").strip()
    project_code = (data.get("project_code") or "").strip()
    if not name:
        return error_response("`name` is required.")
    if not project_code:
        return error_response("`project_code` is required.")

    if Project.query.filter_by(project_code=project_code).first():
        return error_response("A project with this project_code already exists.", 409, "CONFLICT")

    try:
        start_date = parse_date(data.get("start_date"))
        end_date = parse_date(data.get("end_date"))
    except ValueError as e:
        return error_response(str(e))

    status = data.get("status", "PLANNING")
    priority = data.get("priority", "MEDIUM")
    health = data.get("health", "GREEN")

    if status not in PROJECT_STATUSES:
        return error_response(f"Invalid status. Must be one of {PROJECT_STATUSES}")
    if priority not in PROJECT_PRIORITIES:
        return error_response(f"Invalid priority. Must be one of {PROJECT_PRIORITIES}")
    if health not in PROJECT_HEALTH:
        return error_response(f"Invalid health. Must be one of {PROJECT_HEALTH}")

    # A project manager creates projects under themselves. Admins may
    # optionally specify a manager_id to create on behalf of a PM.
    manager_id = user["id"]
    if user["role"] == "ADMIN" and data.get("manager_id"):
        manager_id = data["manager_id"]

    project = Project(
        name=name,
        project_code=project_code,
        description=data.get("description"),
        category=data.get("category"),
        manager_id=manager_id,
        client_id=data.get("client_id"),
        start_date=start_date,
        end_date=end_date,
        priority=priority,
        status=status,
        health=health,
        budget=data.get("budget"),
        department=data.get("department"),
    )
    db.session.add(project)
    db.session.flush()  # get project.id before commit

    ProjectActivity.log(project.id, user["id"], "PROJECT_CREATED", f'Project "{name}" created')
    db.session.commit()

    return jsonify(project.to_dict()), 201


# =====================================================================
# GET /api/projects
# =====================================================================
@projects_bp.route("/api/projects", methods=["GET"])
@require_auth
def list_projects():
    user = g.current_user
    query = Project.query.filter_by(is_archived=False)

    query = scope_projects_query(query, user, Project, Team, TeamMember)

    status = request.args.get("status")
    health = request.args.get("health")
    priority = request.args.get("priority")
    search = request.args.get("search")
    include_archived = request.args.get("include_archived", "false").lower() == "true"

    if include_archived:
        query = Project.query  # reset filter, re-scope
        query = scope_projects_query(query, user, Project, Team, TeamMember)

    if status:
        query = query.filter(Project.status == status)
    if health:
        query = query.filter(Project.health == health)
    if priority:
        query = query.filter(Project.priority == priority)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Project.name.ilike(like), Project.project_code.ilike(like)))

    query = query.order_by(Project.updated_at.desc())

    pagination = paginate_query(query, request.args)
    return jsonify({
        "items": [p.to_dict() for p in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "total_pages": pagination.pages,
    })


# =====================================================================
# GET /api/projects/dashboard  (stats for ProjectDashboard)
# =====================================================================
@projects_bp.route("/api/projects/dashboard", methods=["GET"])
@require_auth
def project_dashboard_stats():
    user = g.current_user
    base_query = scope_projects_query(
        Project.query.filter_by(is_archived=False), user, Project, Team, TeamMember
    )
    all_projects = base_query.all()

    today = date.today()
    upcoming_cutoff = today + timedelta(days=14)

    total = len(all_projects)
    active = sum(1 for p in all_projects if p.status == "ACTIVE")
    completed = sum(1 for p in all_projects if p.status == "COMPLETED")
    delayed = sum(1 for p in all_projects if p.is_delayed)
    at_risk = sum(1 for p in all_projects if p.is_at_risk)
    upcoming_deadlines = [
        p.to_dict() for p in all_projects
        if p.end_date and today <= p.end_date <= upcoming_cutoff
        and p.status not in ("COMPLETED", "CANCELLED", "ARCHIVED")
    ]
    upcoming_deadlines.sort(key=lambda p: p["end_date"])

    return jsonify({
        "total_projects": total,
        "active_projects": active,
        "completed_projects": completed,
        "delayed_projects": delayed,
        "projects_at_risk": at_risk,
        "upcoming_deadlines": upcoming_deadlines[:10],
    })


# =====================================================================
# GET /api/projects/:id
# =====================================================================
@projects_bp.route("/api/projects/<int:project_id>", methods=["GET"])
@require_auth
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    if not user_can_access_project(g.current_user, project):
        return error_response("You do not have access to this project.", 403, "FORBIDDEN")
    return jsonify(project.to_dict(include_relations=True))


# =====================================================================
# PUT /api/projects/:id
# =====================================================================
@projects_bp.route("/api/projects/<int:project_id>", methods=["PUT"])
@require_roles("PROJECT_MANAGER")
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    user = g.current_user

    if user["role"] == "PROJECT_MANAGER" and project.manager_id != user["id"]:
        return error_response("You can only edit projects you manage.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}

    editable_fields = [
        "name", "description", "category", "client_id", "priority",
        "status", "health", "budget", "department",
    ]
    changes = []
    for field in editable_fields:
        if field in data:
            old_val = getattr(project, field)
            new_val = data[field]
            if field == "priority" and new_val not in PROJECT_PRIORITIES:
                return error_response(f"Invalid priority. Must be one of {PROJECT_PRIORITIES}")
            if field == "status" and new_val not in PROJECT_STATUSES:
                return error_response(f"Invalid status. Must be one of {PROJECT_STATUSES}")
            if field == "health" and new_val not in PROJECT_HEALTH:
                return error_response(f"Invalid health. Must be one of {PROJECT_HEALTH}")
            if old_val != new_val:
                changes.append(f"{field}: {old_val} -> {new_val}")
            setattr(project, field, new_val)

    if "start_date" in data:
        try:
            project.start_date = parse_date(data["start_date"])
        except ValueError as e:
            return error_response(str(e))
    if "end_date" in data:
        try:
            project.end_date = parse_date(data["end_date"])
        except ValueError as e:
            return error_response(str(e))

    if changes:
        ProjectActivity.log(
            project.id, user["id"], "PROJECT_UPDATED", "; ".join(changes)
        )

    db.session.commit()
    return jsonify(project.to_dict())


# =====================================================================
# PATCH /api/projects/:id/archive
# =====================================================================
@projects_bp.route("/api/projects/<int:project_id>/archive", methods=["PATCH"])
@require_roles("PROJECT_MANAGER")
def archive_project(project_id):
    project = Project.query.get_or_404(project_id)
    user = g.current_user

    if user["role"] == "PROJECT_MANAGER" and project.manager_id != user["id"]:
        return error_response("You can only archive projects you manage.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}
    archive_value = data.get("archived", True)

    project.is_archived = bool(archive_value)
    if project.is_archived:
        project.status = "ARCHIVED"

    ProjectActivity.log(
        project.id, user["id"],
        "PROJECT_ARCHIVED" if project.is_archived else "PROJECT_UNARCHIVED",
        None,
    )
    db.session.commit()
    return jsonify(project.to_dict())


# =====================================================================
# DELETE /api/projects/:id
# =====================================================================
@projects_bp.route("/api/projects/<int:project_id>", methods=["DELETE"])
@require_roles("PROJECT_MANAGER")
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    user = g.current_user

    if user["role"] == "PROJECT_MANAGER" and project.manager_id != user["id"]:
        return error_response("You can only delete projects you manage.", 403, "FORBIDDEN")

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted."}), 200


# =====================================================================
# GET /api/projects/:id/activity
# =====================================================================
@projects_bp.route("/api/projects/<int:project_id>/activity", methods=["GET"])
@require_auth
def project_activity(project_id):
    project = Project.query.get_or_404(project_id)
    if not user_can_access_project(g.current_user, project):
        return error_response("You do not have access to this project.", 403, "FORBIDDEN")

    entries = (
        ProjectActivity.query.filter_by(project_id=project_id)
        .order_by(ProjectActivity.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([e.to_dict() for e in entries])
