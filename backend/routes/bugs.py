from flask import Blueprint, request, jsonify, g
from db_helpers import query
from utils.shared_auth import login_required, roles_required

bugs_bp = Blueprint("bugs", __name__, url_prefix="/api/bugs")

# Allowed forward transitions per the workflow in the spec.
# RETEST can go to CLOSED (fix confirmed) or back to IN_PROGRESS/REOPENED (fix failed).
VALID_TRANSITIONS = {
    "OPEN": {"ASSIGNED", "REJECTED"},
    "ASSIGNED": {"IN_PROGRESS", "OPEN", "REJECTED"},
    "IN_PROGRESS": {"FIXED", "ASSIGNED"},
    "FIXED": {"RETEST"},
    "RETEST": {"CLOSED", "REOPENED", "IN_PROGRESS"},
    "REOPENED": {"ASSIGNED", "IN_PROGRESS"},
    "CLOSED": set(),
    "REJECTED": set(),
}


def _log_history(bug_id, old_status, new_status, comment):
    query(
        """
        INSERT INTO bug_history (bug_id, changed_by, old_status, new_status, comment)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (bug_id, g.user_id, old_status, new_status, comment),
        commit=True,
    )


@bugs_bp.route("", methods=["GET"])
@login_required
def list_bugs():
    filters = {
        "project_id": request.args.get("project_id"),
        "status": request.args.get("status"),
        "severity": request.args.get("severity"),
        "assigned_to": request.args.get("assigned_to"),
    }
    sql = """
        SELECT b.*, r.name AS reported_by_name, a.name AS assigned_to_name
        FROM bugs b
        JOIN users r ON r.id = b.reported_by
        LEFT JOIN users a ON a.id = b.assigned_to
        WHERE 1=1
    """
    params = []
    for col, val in filters.items():
        if val:
            sql += f" AND b.{col} = %s"
            params.append(val)
    sql += " ORDER BY FIELD(b.severity,'CRITICAL','HIGH','MEDIUM','LOW'), b.created_at DESC"

    rows = query(sql, params)
    return jsonify(rows)


@bugs_bp.route("/<int:bug_id>", methods=["GET"])
@login_required
def get_bug(bug_id):
    row = query(
        """
        SELECT b.*, r.name AS reported_by_name, a.name AS assigned_to_name
        FROM bugs b
        JOIN users r ON r.id = b.reported_by
        LEFT JOIN users a ON a.id = b.assigned_to
        WHERE b.id = %s
        """,
        (bug_id,),
        fetchone=True,
    )
    if not row:
        return jsonify({"error": "Bug not found"}), 404
    return jsonify(row)


@bugs_bp.route("", methods=["POST"])
@login_required
@roles_required("QA", "ADMIN", "LEAD")
def create_bug():
    data = request.get_json(force=True)
    required = ["project_id", "title", "description", "severity", "priority"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    new_id = query(
        """
        INSERT INTO bugs
            (project_id, task_id, test_case_id, reported_by, assigned_to,
             title, description, severity, priority, status, environment)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'OPEN', %s)
        """,
        (
            data["project_id"],
            data.get("task_id"),
            data.get("test_case_id"),
            g.user_id,
            data.get("assigned_to"),
            data["title"],
            data["description"],
            data["severity"],
            data["priority"],
            data.get("environment", ""),
        ),
        commit=True,
    )
    _log_history(new_id, None, "OPEN", "Bug reported")

    if data.get("assigned_to"):
        query("UPDATE bugs SET status='ASSIGNED' WHERE id=%s", (new_id,), commit=True)
        _log_history(new_id, "OPEN", "ASSIGNED", "Auto-assigned on creation")

    row = query("SELECT * FROM bugs WHERE id = %s", (new_id,), fetchone=True)
    return jsonify(row), 201


@bugs_bp.route("/<int:bug_id>", methods=["PUT"])
@login_required
@roles_required("QA", "ADMIN", "LEAD", "DEVELOPER")
def update_bug(bug_id):
    """General field edits (title/description/severity/priority/assignee) — not status."""
    existing = query("SELECT * FROM bugs WHERE id = %s", (bug_id,), fetchone=True)
    if not existing:
        return jsonify({"error": "Bug not found"}), 404
    data = request.get_json(force=True)

    query(
        """
        UPDATE bugs
        SET title = %s, description = %s, severity = %s, priority = %s,
            environment = %s, assigned_to = %s
        WHERE id = %s
        """,
        (
            data.get("title", existing["title"]),
            data.get("description", existing["description"]),
            data.get("severity", existing["severity"]),
            data.get("priority", existing["priority"]),
            data.get("environment", existing["environment"]),
            data.get("assigned_to", existing["assigned_to"]),
            bug_id,
        ),
        commit=True,
    )
    row = query("SELECT * FROM bugs WHERE id = %s", (bug_id,), fetchone=True)
    return jsonify(row)


@bugs_bp.route("/<int:bug_id>/status", methods=["PATCH"])
@login_required
@roles_required("QA", "ADMIN", "LEAD", "DEVELOPER")
def update_bug_status(bug_id):
    existing = query("SELECT * FROM bugs WHERE id = %s", (bug_id,), fetchone=True)
    if not existing:
        return jsonify({"error": "Bug not found"}), 404

    data = request.get_json(force=True)
    new_status = data.get("status")
    comment = data.get("comment", "")
    old_status = existing["status"]

    if new_status not in VALID_TRANSITIONS:
        return jsonify({"error": "Unknown status"}), 400
    if new_status not in VALID_TRANSITIONS[old_status]:
        return jsonify({
            "error": f"Invalid transition {old_status} -> {new_status}",
            "allowed": list(VALID_TRANSITIONS[old_status]),
        }), 400

    resolved_at_sql = ""
    params = [new_status]
    if new_status == "CLOSED":
        resolved_at_sql = ", resolved_at = NOW()"
    query(
        f"UPDATE bugs SET status = %s{resolved_at_sql} WHERE id = %s",
        tuple(params) + (bug_id,),
        commit=True,
    )
    _log_history(bug_id, old_status, new_status, comment)

    row = query("SELECT * FROM bugs WHERE id = %s", (bug_id,), fetchone=True)
    return jsonify(row)


@bugs_bp.route("/<int:bug_id>/history", methods=["GET"])
@login_required
def bug_history(bug_id):
    rows = query(
        """
        SELECT bh.*, u.name AS changed_by_name
        FROM bug_history bh
        JOIN users u ON u.id = bh.changed_by
        WHERE bh.bug_id = %s
        ORDER BY bh.created_at ASC
        """,
        (bug_id,),
    )
    return jsonify(rows)
