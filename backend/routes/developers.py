from datetime import datetime

from flask import Blueprint, g, jsonify, request

from utils.shared_auth import login_required
from extensions import db
from models import Task

developers_bp = Blueprint("developers", __name__, url_prefix="/api/developers")


def _can_view_developer_data(user, developer_id):
    if user["role"] in ("ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "QA"):
        return True
    if user["role"] == "DEVELOPER":
        return user["user_id"] == developer_id
    return False


def _build_stats(tasks):
    today = datetime.utcnow().date()
    stats = {
        "total_tasks": len(tasks),
        "completed": 0,
        "in_progress": 0,
        "not_started": 0,
        "blocked": 0,
        "in_review": 0,
        "overdue": 0,
    }
    for t in tasks:
        key = t.status.lower()
        if key in stats:
            stats[key] += 1
        if t.status != "COMPLETED" and t.due_date and t.due_date < today:
            stats["overdue"] += 1

    stats["progress_percentage"] = (
        round((stats["completed"] / stats["total_tasks"]) * 100) if stats["total_tasks"] else 0
    )
    return stats


@developers_bp.route("/<int:developer_id>/tasks", methods=["GET"])
@login_required
def developer_tasks(developer_id):
    if not _can_view_developer_data(g.current_user, developer_id):
        return jsonify({"error": "Forbidden"}), 403

    query = Task.query.filter_by(assigned_to=developer_id)
    if request.args.get("status"):
        query = query.filter_by(status=request.args["status"])
    tasks = query.order_by(Task.due_date.asc().nullslast()).all()
    return jsonify([t.to_dict() for t in tasks])


@developers_bp.route("/<int:developer_id>/dashboard", methods=["GET"])
@login_required
def developer_dashboard(developer_id):
    if not _can_view_developer_data(g.current_user, developer_id):
        return jsonify({"error": "Forbidden"}), 403

    tasks = Task.query.filter_by(assigned_to=developer_id).all()
    stats = _build_stats(tasks)

    upcoming = sorted(
        [t for t in tasks if t.due_date and t.status != "COMPLETED"],
        key=lambda t: t.due_date,
    )[:5]

    return jsonify(
        {
            "stats": stats,
            "upcoming_deadlines": [t.to_dict() for t in upcoming],
        }
    )
