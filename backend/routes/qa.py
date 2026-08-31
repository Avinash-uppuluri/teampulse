from flask import Blueprint, request, jsonify, g
from db_helpers import query
from utils.shared_auth import login_required, roles_required

qa_bp = Blueprint("qa", __name__, url_prefix="/api/qa")


@qa_bp.route("/test-cases", methods=["GET"])
@login_required
def list_test_cases():
    project_id = request.args.get("project_id")
    status = request.args.get("status")
    task_id = request.args.get("task_id")

    sql = """
        SELECT tc.*, u.name AS created_by_name
        FROM test_cases tc
        JOIN users u ON u.id = tc.created_by
        WHERE 1=1
    """
    params = []
    if project_id:
        sql += " AND tc.project_id = %s"
        params.append(project_id)
    if status:
        sql += " AND tc.status = %s"
        params.append(status)
    if task_id:
        sql += " AND tc.task_id = %s"
        params.append(task_id)
    sql += " ORDER BY tc.created_at DESC"

    rows = query(sql, params)
    return jsonify(rows)


@qa_bp.route("/test-cases/<int:tc_id>", methods=["GET"])
@login_required
def get_test_case(tc_id):
    row = query(
        "SELECT * FROM test_cases WHERE id = %s", (tc_id,), fetchone=True
    )
    if not row:
        return jsonify({"error": "Test case not found"}), 404
    return jsonify(row)


@qa_bp.route("/test-cases", methods=["POST"])
@login_required
@roles_required("QA", "ADMIN", "LEAD")
def create_test_case():
    data = request.get_json(force=True)
    required = ["project_id", "title", "steps", "expected_result"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    new_id = query(
        """
        INSERT INTO test_cases
            (project_id, task_id, created_by, title, description, steps, expected_result, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, 'NOT_RUN')
        """,
        (
            data["project_id"],
            data.get("task_id"),
            g.user_id,
            data["title"],
            data.get("description", ""),
            data["steps"],
            data["expected_result"],
        ),
        commit=True,
    )
    row = query("SELECT * FROM test_cases WHERE id = %s", (new_id,), fetchone=True)
    return jsonify(row), 201


@qa_bp.route("/test-cases/<int:tc_id>", methods=["PUT"])
@login_required
@roles_required("QA", "ADMIN", "LEAD")
def update_test_case(tc_id):
    data = request.get_json(force=True)
    existing = query("SELECT * FROM test_cases WHERE id = %s", (tc_id,), fetchone=True)
    if not existing:
        return jsonify({"error": "Test case not found"}), 404

    allowed_status = {"NOT_RUN", "PASSED", "FAILED", "BLOCKED"}
    status = data.get("status", existing["status"])
    if status not in allowed_status:
        return jsonify({"error": f"Invalid status. Must be one of {allowed_status}"}), 400

    query(
        """
        UPDATE test_cases
        SET title = %s, description = %s, steps = %s, expected_result = %s,
            actual_result = %s, status = %s
        WHERE id = %s
        """,
        (
            data.get("title", existing["title"]),
            data.get("description", existing["description"]),
            data.get("steps", existing["steps"]),
            data.get("expected_result", existing["expected_result"]),
            data.get("actual_result", existing["actual_result"]),
            status,
            tc_id,
        ),
        commit=True,
    )
    row = query("SELECT * FROM test_cases WHERE id = %s", (tc_id,), fetchone=True)
    return jsonify(row)


@qa_bp.route("/dashboard", methods=["GET"])
@login_required
def qa_dashboard():
    """Aggregate counts for the QA Dashboard cards (Part A spec)."""
    project_id = request.args.get("project_id")

    tc_filter = " WHERE project_id = %s" if project_id else ""
    params = (project_id,) if project_id else ()

    tc_rows = query(
        f"SELECT status, COUNT(*) AS cnt FROM test_cases{tc_filter} GROUP BY status",
        params,
    )
    tc_counts = {"NOT_RUN": 0, "PASSED": 0, "FAILED": 0, "BLOCKED": 0}
    for r in tc_rows:
        tc_counts[r["status"]] = r["cnt"]
    total_tc = sum(tc_counts.values())

    bug_filter = " WHERE project_id = %s" if project_id else ""
    bug_rows = query(
        f"SELECT status, severity, COUNT(*) AS cnt FROM bugs{bug_filter} GROUP BY status, severity",
        params,
    )
    bug_status_counts = {"OPEN": 0, "FIXED": 0, "CLOSED": 0}
    severity_counts = {"CRITICAL": 0, "HIGH": 0}
    total_bugs = 0
    for r in bug_rows:
        total_bugs += r["cnt"]
        if r["status"] in bug_status_counts:
            bug_status_counts[r["status"]] += r["cnt"]
        if r["status"] == "OPEN" and r["severity"] in severity_counts:
            severity_counts[r["severity"]] += r["cnt"]

    return jsonify({
        "test_cases": {
            "total": total_tc,
            "passed": tc_counts["PASSED"],
            "failed": tc_counts["FAILED"],
            "blocked": tc_counts["BLOCKED"],
            "not_run": tc_counts["NOT_RUN"],
        },
        "bugs": {
            "total": total_bugs,
            "open": bug_status_counts["OPEN"],
            "critical": severity_counts["CRITICAL"],
            "high": severity_counts["HIGH"],
            "fixed": bug_status_counts["FIXED"],
            "closed": bug_status_counts["CLOSED"],
        },
    })
