from datetime import datetime

from flask import Blueprint, g, jsonify, request
from sqlalchemy import or_

from utils.shared_auth import login_required, roles_required
from extensions import db, socketio
from models import Task, TaskDependency
from utils.task_permissions import (
    can_create_task_for_team,
    can_manage_task,
    can_update_own_task,
    can_view_task,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")

VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "BLOCKED"]
VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

# Allowed forward transitions per the spec's workflow diagram.
STATUS_TRANSITIONS = {
    "NOT_STARTED": {"IN_PROGRESS"},
    "IN_PROGRESS": {"IN_REVIEW", "BLOCKED"},
    "IN_REVIEW": {"COMPLETED", "IN_PROGRESS"},  # review can bounce back on changes-requested
    "BLOCKED": {"IN_PROGRESS"},
    "COMPLETED": set(),
}

# What a DEVELOPER is allowed to set a task's status to directly.
DEVELOPER_ALLOWED_STATUSES = {"IN_PROGRESS", "IN_REVIEW", "BLOCKED"}


def _apply_filters(query, args):
    if args.get("status"):
        query = query.filter(Task.status == args["status"])
    if args.get("priority"):
        query = query.filter(Task.priority == args["priority"])
    if args.get("developer_id"):
        query = query.filter(Task.assigned_to == args["developer_id"])
    if args.get("project_id"):
        query = query.filter(Task.project_id == args["project_id"])
    if args.get("team_id"):
        query = query.filter(Task.team_id == args["team_id"])
    if args.get("due_before"):
        query = query.filter(Task.due_date <= args["due_before"])
    if args.get("due_after"):
        query = query.filter(Task.due_date >= args["due_after"])
    if args.get("search"):
        term = f"%{args['search']}%"
        query = query.filter(or_(Task.title.ilike(term), Task.description.ilike(term)))
    return query


def _scope_query_to_role(query, user):
    role, user_id = user["role"], user["user_id"]
    if role == "ADMIN":
        return query
    if role == "PROJECT_MANAGER":
        from models import Project

        managed_ids = [p.id for p in Project.query.filter_by(manager_id=user_id).all()]
        return query.filter(Task.project_id.in_(managed_ids))
    if role == "TEAM_LEAD":
        from models import Team

        led_ids = [t.id for t in Team.query.filter_by(team_lead_id=user_id).all()]
        return query.filter(Task.team_id.in_(led_ids))
    if role == "DEVELOPER":
        return query.filter(Task.assigned_to == user_id)
    if role == "QA":
        from models import TeamMember

        team_ids = [tm.team_id for tm in TeamMember.query.filter_by(user_id=user_id).all()]
        return query.filter(Task.team_id.in_(team_ids))
    # CLIENT: no internal task access by default
    return query.filter(db.false())


@tasks_bp.route("", methods=["GET"])
@login_required
def list_tasks():
    query = _scope_query_to_role(Task.query, g.current_user)
    query = _apply_filters(query, request.args)
    query = query.order_by(Task.due_date.asc().nullslast(), Task.priority.desc())

    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 25)), 100)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "tasks": [t.to_dict() for t in paginated.items],
            "page": page,
            "per_page": per_page,
            "total": paginated.total,
            "total_pages": paginated.pages,
        }
    )


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_view_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403
    return jsonify(task.to_dict())


@tasks_bp.route("", methods=["POST"])
@login_required
@roles_required("TEAM_LEAD")
def create_task():
    data = request.get_json(force=True) or {}

    required = ["project_id", "team_id", "title"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    if not can_create_task_for_team(g.current_user, data["team_id"]):
        return jsonify({"error": "You do not lead this team"}), 403

    if data.get("priority") and data["priority"] not in VALID_PRIORITIES:
        return jsonify({"error": "Invalid priority"}), 400

    task = Task(
        project_id=data["project_id"],
        team_id=data["team_id"],
        title=data["title"],
        description=data.get("description"),
        assigned_to=data.get("assigned_to"),
        created_by=g.current_user["user_id"],
        priority=data.get("priority", "MEDIUM"),
        status="NOT_STARTED",
        progress=0,
        start_date=data.get("start_date"),
        due_date=data.get("due_date"),
        estimated_hours=data.get("estimated_hours"),
        category=data.get("category"),
    )
    db.session.add(task)
    db.session.flush()  # get task.id before committing dependencies

    for dep_id in data.get("depends_on", []):
        db.session.add(TaskDependency(task_id=task.id, depends_on_task_id=dep_id))

    db.session.commit()

    socketio.emit("taskCreated", task.to_dict())
    return jsonify(task.to_dict()), 201


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@login_required
@roles_required("TEAM_LEAD")
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_manage_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(force=True) or {}
    editable_fields = [
        "title",
        "description",
        "assigned_to",
        "priority",
        "start_date",
        "due_date",
        "estimated_hours",
        "actual_hours",
        "category",
    ]
    for field in editable_fields:
        if field in data:
            setattr(task, field, data[field])

    if "depends_on" in data:
        TaskDependency.query.filter_by(task_id=task.id).delete()
        for dep_id in data["depends_on"]:
            if dep_id != task.id:
                db.session.add(TaskDependency(task_id=task.id, depends_on_task_id=dep_id))

    db.session.commit()
    socketio.emit("taskUpdated", task.to_dict())
    return jsonify(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@login_required
@roles_required("TEAM_LEAD")
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_manage_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(task)
    db.session.commit()
    socketio.emit("taskUpdated", {"id": task_id, "deleted": True})
    return jsonify({"message": "Task deleted"}), 200


@tasks_bp.route("/<int:task_id>/assign", methods=["PATCH"])
@login_required
@roles_required("TEAM_LEAD")
def assign_task(task_id):
    """Handles both initial assignment and reassignment."""
    task = Task.query.get_or_404(task_id)
    if not can_manage_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(force=True) or {}
    developer_id = data.get("assigned_to")
    if not developer_id:
        return jsonify({"error": "assigned_to is required"}), 400

    task.assigned_to = developer_id
    db.session.commit()

    socketio.emit("taskAssigned", task.to_dict())
    return jsonify(task.to_dict())


def _blocking_dependencies_incomplete(task):
    incomplete = (
        db.session.query(Task)
        .join(TaskDependency, TaskDependency.depends_on_task_id == Task.id)
        .filter(TaskDependency.task_id == task.id, Task.status != "COMPLETED")
        .all()
    )
    return incomplete


@tasks_bp.route("/<int:task_id>/status", methods=["PATCH"])
@login_required
def update_status(task_id):
    task = Task.query.get_or_404(task_id)
    user = g.current_user

    is_owner_dev = can_update_own_task(user, task)
    is_manager = can_manage_task(user, task)
    if not (is_owner_dev or is_manager):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(force=True) or {}
    new_status = data.get("status")
    if new_status not in VALID_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    if is_owner_dev and not is_manager and new_status not in DEVELOPER_ALLOWED_STATUSES:
        return jsonify({"error": "Developers cannot set this status"}), 403

    if not is_manager:  # developers must follow the defined workflow
        allowed_next = STATUS_TRANSITIONS.get(task.status, set())
        if new_status not in allowed_next:
            return (
                jsonify(
                    {
                        "error": f"Cannot move from {task.status} to {new_status}",
                        "allowed_next": list(allowed_next),
                    }
                ),
                400,
            )

    if new_status == "IN_PROGRESS" and task.status == "NOT_STARTED":
        blockers = _blocking_dependencies_incomplete(task)
        if blockers:
            return (
                jsonify(
                    {
                        "error": "Blocked by incomplete dependencies",
                        "blocked_by": [b.id for b in blockers],
                    }
                ),
                409,
            )

    task.status = new_status
    if new_status == "COMPLETED":
        task.progress = 100
        task.completed_at = datetime.utcnow()
    db.session.commit()

    event = {
        "BLOCKED": "taskBlocked",
        "COMPLETED": "taskCompleted",
    }.get(new_status, "taskUpdated")
    socketio.emit(event, task.to_dict())

    return jsonify(task.to_dict())


@tasks_bp.route("/<int:task_id>/progress", methods=["PATCH"])
@login_required
def update_progress(task_id):
    task = Task.query.get_or_404(task_id)
    user = g.current_user

    if not (can_update_own_task(user, task) or can_manage_task(user, task)):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(force=True) or {}
    progress = data.get("progress")
    if progress is None or not (0 <= int(progress) <= 100):
        return jsonify({"error": "progress must be an integer between 0 and 100"}), 400

    task.progress = int(progress)
    if task.progress > 0 and task.status == "NOT_STARTED":
        task.status = "IN_PROGRESS"
    if task.progress == 100:
        task.status = "COMPLETED"
        task.completed_at = datetime.utcnow()

    db.session.commit()
    socketio.emit("taskUpdated", task.to_dict())
    return jsonify(task.to_dict())
