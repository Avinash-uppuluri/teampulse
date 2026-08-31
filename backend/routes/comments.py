from flask import Blueprint, g, jsonify, request

from utils.shared_auth import login_required
from extensions import db, socketio
from models import Task, TaskComment
from utils.task_permissions import can_view_task

comments_bp = Blueprint("comments", __name__, url_prefix="/api/tasks")


@comments_bp.route("/<int:task_id>/comments", methods=["GET"])
@login_required
def list_comments(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_view_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    comments = (
        TaskComment.query.filter_by(task_id=task_id)
        .order_by(TaskComment.created_at.asc())
        .all()
    )
    return jsonify([c.to_dict() for c in comments])


@comments_bp.route("/<int:task_id>/comments", methods=["POST"])
@login_required
def add_comment(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_view_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(force=True) or {}
    text = (data.get("comment") or "").strip()
    if not text:
        return jsonify({"error": "comment text is required"}), 400

    comment = TaskComment(task_id=task_id, user_id=g.current_user["user_id"], comment=text)
    db.session.add(comment)
    db.session.commit()

    socketio.emit("taskUpdated", {"id": task_id, "new_comment": comment.to_dict()})
    return jsonify(comment.to_dict()), 201
