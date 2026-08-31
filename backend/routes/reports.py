import csv
import io
from flask import Blueprint, request, jsonify, Response
from db_helpers import query
from utils.shared_auth import login_required

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _apply_filters(sql, params, args, mapping):
    """mapping: {query_param_name: sql_column}"""
    for param, col in mapping.items():
        val = args.get(param)
        if val:
            sql += f" AND {col} = %s"
            params.append(val)
    return sql, params


def _maybe_csv(rows, filename):
    if request.args.get("export") == "csv":
        buf = io.StringIO()
        if rows:
            writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        return Response(
            buf.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
        )
    return None


@reports_bp.route("/project", methods=["GET"])
@login_required
def project_report():
    sql = """
        SELECT p.id, p.name, p.status, p.start_date, p.end_date,
               COUNT(t.id) AS total_tasks,
               SUM(CASE WHEN t.status='COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE 1=1
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {"project": "p.id", "status": "p.status"})
    sql += " GROUP BY p.id"

    rows = query(sql, params)
    for r in rows:
        r["completion_pct"] = round((r["completed_tasks"] / r["total_tasks"] * 100), 1) if r["total_tasks"] else 0

    csv_resp = _maybe_csv(rows, "project_report")
    return csv_resp or jsonify(rows)


@reports_bp.route("/team", methods=["GET"])
@login_required
def team_report():
    sql = """
        SELECT tm.id, tm.name AS team_name, u.name AS team_lead,
               COUNT(t.id) AS total_tasks,
               SUM(CASE WHEN t.status='COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks,
               SUM(CASE WHEN t.status != 'COMPLETED' AND t.due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_tasks
        FROM teams tm
        LEFT JOIN users u ON u.id = tm.team_lead_id  -- FIX (merge): real column is team_lead_id, not lead_id
        LEFT JOIN tasks t ON t.team_id = tm.id
        WHERE 1=1
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {"team": "tm.id"})
    sql += " GROUP BY tm.id"

    rows = query(sql, params)
    csv_resp = _maybe_csv(rows, "team_report")
    return csv_resp or jsonify(rows)


@reports_bp.route("/developer", methods=["GET"])
@login_required
def developer_report():
    sql = """
        SELECT u.id, u.name,
               COUNT(t.id) AS assigned_tasks,
               SUM(CASE WHEN t.status='COMPLETED' THEN 1 ELSE 0 END) AS completed_tasks,
               SUM(CASE WHEN t.status != 'COMPLETED' AND t.due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_tasks
        FROM users u
        LEFT JOIN tasks t ON t.assigned_to = u.id
        WHERE u.role = 'DEVELOPER'
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {"developer": "u.id"})
    sql += " GROUP BY u.id"

    rows = query(sql, params)
    csv_resp = _maybe_csv(rows, "developer_report")
    return csv_resp or jsonify(rows)


@reports_bp.route("/tasks", methods=["GET"])
@login_required
def task_report():
    sql = """
        SELECT t.id, t.title, t.status, t.due_date, p.name AS project_name, u.name AS assignee
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_to
        WHERE 1=1
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {
        "project": "t.project_id", "status": "t.status", "developer": "t.assigned_to",
    })
    if request.args.get("date_from"):
        sql += " AND t.due_date >= %s"
        params.append(request.args["date_from"])
    if request.args.get("date_to"):
        sql += " AND t.due_date <= %s"
        params.append(request.args["date_to"])
    sql += " ORDER BY t.due_date ASC"

    rows = query(sql, params)
    csv_resp = _maybe_csv(rows, "task_report")
    return csv_resp or jsonify(rows)


@reports_bp.route("/bugs", methods=["GET"])
@login_required
def bug_report():
    sql = """
        SELECT b.id, b.title, b.severity, b.priority, b.status,
               p.name AS project_name, a.name AS assigned_to_name, b.created_at, b.resolved_at
        FROM bugs b
        JOIN projects p ON p.id = b.project_id
        LEFT JOIN users a ON a.id = b.assigned_to
        WHERE 1=1
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {
        "project": "b.project_id", "status": "b.status", "priority": "b.priority",
    })
    if request.args.get("date_from"):
        sql += " AND b.created_at >= %s"
        params.append(request.args["date_from"])
    if request.args.get("date_to"):
        sql += " AND b.created_at <= %s"
        params.append(request.args["date_to"])
    sql += " ORDER BY b.created_at DESC"

    rows = query(sql, params)
    csv_resp = _maybe_csv(rows, "bug_report")
    return csv_resp or jsonify(rows)


@reports_bp.route("/qa", methods=["GET"])
@login_required
def qa_report():
    sql = """
        SELECT tc.id, tc.title, tc.status, p.name AS project_name, u.name AS created_by_name, tc.created_at
        FROM test_cases tc
        JOIN projects p ON p.id = tc.project_id
        JOIN users u ON u.id = tc.created_by
        WHERE 1=1
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {"project": "tc.project_id", "status": "tc.status"})
    sql += " ORDER BY tc.created_at DESC"

    rows = query(sql, params)
    csv_resp = _maybe_csv(rows, "qa_report")
    return csv_resp or jsonify(rows)


@reports_bp.route("/milestones", methods=["GET"])
@login_required
def milestone_report():
    """Assumes a `milestones` table exists from Parts 1-3 (project_id, title, due_date, status)."""
    sql = """
        SELECT m.id, m.title, m.due_date, m.status, p.name AS project_name
        FROM milestones m
        JOIN projects p ON p.id = m.project_id
        WHERE 1=1
    """
    params = []
    sql, params = _apply_filters(sql, params, request.args, {"project": "m.project_id", "status": "m.status"})
    sql += " ORDER BY m.due_date ASC"

    rows = query(sql, params)
    csv_resp = _maybe_csv(rows, "milestone_report")
    return csv_resp or jsonify(rows)
