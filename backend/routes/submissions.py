from datetime import datetime

from flask import Blueprint, g, jsonify, request

from utils.shared_auth import login_required, roles_required
from extensions import db, socketio
from models import Task, TaskSubmission
from utils.task_permissions import can_manage_task, can_update_own_task, can_view_task

submissions_bp = Blueprint("submissions", __name__, url_prefix="/api/tasks")


@submissions_bp.route("/<int:task_id>/submissions", methods=["GET"])
@login_required
def list_submissions(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_view_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    subs = (
        TaskSubmission.query.filter_by(task_id=task_id)
        .order_by(TaskSubmission.submitted_at.desc())
        .all()
    )
    return jsonify([s.to_dict() for s in subs])


@submissions_bp.route("/<int:task_id>/submissions", methods=["POST"])
@login_required
def submit_work(task_id):
    task = Task.query.get_or_404(task_id)
    if not can_update_own_task(g.current_user, task):
        return jsonify({"error": "Only the assigned developer can submit work"}), 403

    data = request.get_json(force=True) or {}
    if not data.get("description") and not data.get("submission_url"):
        return jsonify({"error": "Provide a description or a submission_url"}), 400

    submission = TaskSubmission(
        task_id=task_id,
        submitted_by=g.current_user["user_id"],
        description=data.get("description"),
        submission_url=data.get("submission_url"),
        file_path=data.get("file_path"),
        review_status="PENDING",
    )
    db.session.add(submission)

    # Submitting work moves the task into review automatically.
    task.status = "IN_REVIEW"
    db.session.commit()

    socketio.emit("taskSubmitted", {"task": task.to_dict(), "submission": submission.to_dict()})
    return jsonify(submission.to_dict()), 201


@submissions_bp.route("/submissions/<int:submission_id>/review", methods=["PATCH"])
@login_required
@roles_required("TEAM_LEAD")
def review_submission(submission_id):
    submission = TaskSubmission.query.get_or_404(submission_id)
    task = Task.query.get_or_404(submission.task_id)

    if not can_manage_task(g.current_user, task):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(force=True) or {}
    status = data.get("review_status")
    if status not in ("APPROVED", "CHANGES_REQUESTED"):
        return jsonify({"error": "review_status must be APPROVED or CHANGES_REQUESTED"}), 400

    submission.review_status = status
    submission.reviewed_by = g.current_user["user_id"]
    submission.reviewed_at = datetime.utcnow()
    submission.review_notes = data.get("review_notes")

    if status == "APPROVED":
        task.status = "COMPLETED"
        task.progress = 100
        task.completed_at = datetime.utcnow()
    else:
        task.status = "IN_PROGRESS"

    db.session.commit()
    socketio.emit("taskUpdated", task.to_dict())
    return jsonify(submission.to_dict())
