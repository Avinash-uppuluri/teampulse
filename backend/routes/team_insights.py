from datetime import datetime

from flask import Blueprint, g, jsonify, request

from utils.shared_auth import login_required
from models import Task, TeamMember, User
from utils.task_permissions import is_member_of_team, is_team_lead_of, manages_project

team_insights_bp = Blueprint("team_insights", __name__, url_prefix="/api/teams")


def _can_view_team(user, team_id):
    role, user_id = user["role"], user["user_id"]
    if role == "ADMIN":
        return True
    if role == "TEAM_LEAD":
        return is_team_lead_of(user_id, team_id)
    if role == "QA":
        return is_member_of_team(user_id, team_id)
    if role == "PROJECT_MANAGER":
        team = _get_team_project(team_id)
        return team is not None and manages_project(user_id, team.project_id)
    return False


def _get_team_project(team_id):
    from models import Team

    return Team.query.get(team_id)


@team_insights_bp.route("/<int:team_id>/tasks", methods=["GET"])
@login_required
def team_tasks(team_id):
    if not _can_view_team(g.current_user, team_id):
        return jsonify({"error": "Forbidden"}), 403

    query = Task.query.filter_by(team_id=team_id)
    if request.args.get("status"):
        query = query.filter_by(status=request.args["status"])
    if request.args.get("developer_id"):
        query = query.filter_by(assigned_to=request.args["developer_id"])

    tasks = query.order_by(Task.due_date.asc().nullslast()).all()
    return jsonify([t.to_dict() for t in tasks])


@team_insights_bp.route("/<int:team_id>/workload", methods=["GET"])
@login_required
def team_workload(team_id):
    """Per-developer breakdown for the Team Lead dashboard."""
    if not _can_view_team(g.current_user, team_id):
        return jsonify({"error": "Forbidden"}), 403

    today = datetime.utcnow().date()
    tasks = Task.query.filter_by(team_id=team_id).all()

    by_dev = {}
    for t in tasks:
        if not t.assigned_to:
            continue
        entry = by_dev.setdefault(
            t.assigned_to,
            {
                "developer_id": t.assigned_to,
                "assigned_tasks": 0,
                "completed": 0,
                "in_progress": 0,
                "blocked": 0,
                "overdue": 0,
            },
        )
        entry["assigned_tasks"] += 1
        if t.status == "COMPLETED":
            entry["completed"] += 1
        elif t.status == "IN_PROGRESS":
            entry["in_progress"] += 1
        elif t.status == "BLOCKED":
            entry["blocked"] += 1
        if t.status != "COMPLETED" and t.due_date and t.due_date < today:
            entry["overdue"] += 1

    developer_ids = list(by_dev.keys())
    names = {u.id: u.name for u in User.query.filter(User.id.in_(developer_ids)).all()}

    workload = []
    for dev_id, entry in by_dev.items():
        entry["developer_name"] = names.get(dev_id, f"User #{dev_id}")
        entry["progress_percentage"] = (
            round((entry["completed"] / entry["assigned_tasks"]) * 100)
            if entry["assigned_tasks"]
            else 0
        )
        workload.append(entry)

    workload.sort(key=lambda e: e["developer_name"])
    return jsonify(workload)


@team_insights_bp.route("/<int:team_id>/deadlines", methods=["GET"])
@login_required
def team_deadlines(team_id):
    if not _can_view_team(g.current_user, team_id):
        return jsonify({"error": "Forbidden"}), 403

    tasks = (
        Task.query.filter_by(team_id=team_id)
        .filter(Task.status != "COMPLETED")
        .filter(Task.due_date.isnot(None))
        .order_by(Task.due_date.asc())
        .all()
    )
    return jsonify([t.to_dict() for t in tasks])
