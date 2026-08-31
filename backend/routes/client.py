from flask import Blueprint, request, jsonify, g
from db_helpers import query
from utils.shared_auth import login_required, roles_required
from routes.monitoring import calculate_project_health

client_bp = Blueprint("client", __name__, url_prefix="/api/client")


@client_bp.route("/projects", methods=["GET"])
@login_required
@roles_required("CLIENT")
def client_projects():
    """
    Restricted view: only project-level, client-safe fields.
    Explicitly EXCLUDES internal comments, dev performance, sensitive info.
    FIX (merge): there's no project_clients mapping table -- Part 2's real
    schema stores a single client directly on `projects.client_id`.
    """
    rows = query(
        """
        SELECT p.id, p.name, p.status, p.start_date, p.end_date
        FROM projects p
        WHERE p.client_id = %s
        """,
        (g.user_id,),
    )

    for r in rows:
        health = calculate_project_health(r["id"])
        r["health"] = health["health"]

        task_stats = query(
            """
            SELECT COUNT(*) AS total, SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed
            FROM tasks WHERE project_id = %s
            """,
            (r["id"],),
            fetchone=True,
        )
        total = task_stats["total"] or 0
        completed = task_stats["completed"] or 0
        r["overall_progress_pct"] = round((completed / total * 100), 1) if total else 0

        r["milestones"] = query(
            "SELECT id, title, due_date, status FROM milestones WHERE project_id = %s ORDER BY due_date ASC",
            (r["id"],),
        )

        # High-level issues only: counts, never internal comments/details
        bug_stats = query(
            """
            SELECT
                SUM(CASE WHEN status NOT IN ('CLOSED','REJECTED') THEN 1 ELSE 0 END) AS open_issues,
                SUM(CASE WHEN status NOT IN ('CLOSED','REJECTED') AND severity='CRITICAL' THEN 1 ELSE 0 END) AS critical_issues
            FROM bugs WHERE project_id = %s
            """,
            (r["id"],),
            fetchone=True,
        )
        r["high_level_issues"] = {
            "open": bug_stats["open_issues"] or 0,
            "critical": bug_stats["critical_issues"] or 0,
        }

    return jsonify(rows)


@client_bp.route("/feedback", methods=["POST"])
@login_required
@roles_required("CLIENT")
def submit_feedback():
    data = request.get_json(force=True)
    if not data.get("project_id") or not data.get("message"):
        return jsonify({"error": "project_id and message are required"}), 400

    rating = data.get("rating")
    if rating is not None and not (1 <= int(rating) <= 5):
        return jsonify({"error": "rating must be between 1 and 5"}), 400

    new_id = query(
        """
        INSERT INTO client_feedback (project_id, client_id, message, rating, status)
        VALUES (%s, %s, %s, %s, 'NEW')
        """,
        (data["project_id"], g.user_id, data["message"], rating),
        commit=True,
    )
    row = query("SELECT * FROM client_feedback WHERE id = %s", (new_id,), fetchone=True)
    return jsonify(row), 201


@client_bp.route("/feedback", methods=["GET"])
@login_required
@roles_required("CLIENT", "ADMIN", "LEAD")
def list_feedback():
    """Clients see only their own feedback; internal roles can filter by project."""
    if g.role == "CLIENT":
        rows = query(
            "SELECT * FROM client_feedback WHERE client_id = %s ORDER BY created_at DESC",
            (g.user_id,),
        )
    else:
        project_id = request.args.get("project_id")
        sql = "SELECT * FROM client_feedback WHERE 1=1"
        params = []
        if project_id:
            sql += " AND project_id = %s"
            params.append(project_id)
        sql += " ORDER BY created_at DESC"
        rows = query(sql, params)
    return jsonify(rows)


@client_bp.route("/feedback/<int:feedback_id>/status", methods=["PATCH"])
@login_required
@roles_required("ADMIN", "LEAD")
def update_feedback_status(feedback_id):
    data = request.get_json(force=True)
    status = data.get("status")
    if status not in {"NEW", "REVIEWED", "RESOLVED"}:
        return jsonify({"error": "Invalid status"}), 400
    query("UPDATE client_feedback SET status = %s WHERE id = %s", (status, feedback_id), commit=True)
    row = query("SELECT * FROM client_feedback WHERE id = %s", (feedback_id,), fetchone=True)
    return jsonify(row)
