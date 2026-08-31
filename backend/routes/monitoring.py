from flask import Blueprint, request, jsonify
from db_helpers import query
from utils.shared_auth import login_required

monitoring_bp = Blueprint("monitoring", __name__, url_prefix="/api/monitoring")


def _get_health_config():
    rows = query("SELECT config_key, config_value FROM health_config")
    return {r["config_key"]: r["config_value"] for r in rows}


def calculate_project_health(project_id, cfg=None):
    """
    Configurable RED/YELLOW/GREEN calculation.
    Looks at: overdue task %, open critical bugs, total open bugs.
    Worst signal wins.
    """
    cfg = cfg or _get_health_config()

    task_stats = query(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status != 'COMPLETED' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
        FROM tasks WHERE project_id = %s
        """,
        (project_id,),
        fetchone=True,
    ) or {"total": 0, "overdue": 0}

    total = task_stats["total"] or 0
    overdue = task_stats["overdue"] or 0
    overdue_pct = (overdue / total * 100) if total else 0

    bug_stats = query(
        """
        SELECT
            SUM(CASE WHEN status NOT IN ('CLOSED','REJECTED') THEN 1 ELSE 0 END) AS open_bugs,
            SUM(CASE WHEN status NOT IN ('CLOSED','REJECTED') AND severity='CRITICAL' THEN 1 ELSE 0 END) AS critical_bugs
        FROM bugs WHERE project_id = %s
        """,
        (project_id,),
        fetchone=True,
    ) or {"open_bugs": 0, "critical_bugs": 0}

    open_bugs = bug_stats["open_bugs"] or 0
    critical_bugs = bug_stats["critical_bugs"] or 0

    reasons = []
    health = "GREEN"

    if (overdue_pct >= cfg["red_overdue_task_pct"] or
            critical_bugs >= cfg["red_critical_bugs"] or
            open_bugs >= cfg["red_open_bugs"]):
        health = "RED"
    elif (overdue_pct >= cfg["yellow_overdue_task_pct"] or
            critical_bugs >= cfg["yellow_critical_bugs"] or
            open_bugs >= cfg["yellow_open_bugs"]):
        health = "YELLOW"

    if overdue_pct >= cfg["yellow_overdue_task_pct"]:
        reasons.append(f"{overdue_pct:.0f}% of tasks overdue")
    if critical_bugs >= cfg["yellow_critical_bugs"]:
        reasons.append(f"{critical_bugs} open critical bug(s)")
    if open_bugs >= cfg["yellow_open_bugs"]:
        reasons.append(f"{open_bugs} open bugs")
    if not reasons:
        reasons.append("On schedule with manageable issues")

    return {
        "health": health,
        "reasons": reasons,
        "overdue_pct": round(overdue_pct, 1),
        "open_bugs": open_bugs,
        "critical_bugs": critical_bugs,
        "total_tasks": total,
        "overdue_tasks": overdue,
    }


@monitoring_bp.route("/dashboard", methods=["GET"])
@login_required
def main_dashboard():
    projects = query(
        "SELECT status, COUNT(*) AS cnt FROM projects GROUP BY status"
    )
    proj_counts = {r["status"]: r["cnt"] for r in projects}
    total_projects = sum(proj_counts.values())

    tasks = query(
        """
        SELECT
            SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status != 'COMPLETED' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status != 'COMPLETED' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue,
            COUNT(*) AS total
        FROM tasks
        """,
        fetchone=True,
    )

    bugs = query(
        """
        SELECT
            SUM(CASE WHEN status NOT IN ('CLOSED','REJECTED') THEN 1 ELSE 0 END) AS open_bugs,
            SUM(CASE WHEN status NOT IN ('CLOSED','REJECTED') AND severity='CRITICAL' THEN 1 ELSE 0 END) AS critical_bugs
        FROM bugs
        """,
        fetchone=True,
    )

    team_members = query("SELECT COUNT(DISTINCT id) AS cnt FROM users WHERE role IN ('DEVELOPER','LEAD','QA')", fetchone=True)

    return jsonify({
        "total_projects": total_projects,
        "active_projects": proj_counts.get("ACTIVE", 0),
        "completed_projects": proj_counts.get("COMPLETED", 0),
        "delayed_projects": proj_counts.get("DELAYED", 0) or proj_counts.get("ON_HOLD", 0),
        "total_tasks": tasks["total"] or 0,
        "completed_tasks": tasks["completed"] or 0,
        "pending_tasks": tasks["pending"] or 0,
        "overdue_tasks": tasks["overdue"] or 0,
        "open_bugs": bugs["open_bugs"] or 0,
        "critical_bugs": bugs["critical_bugs"] or 0,
        "team_members": team_members["cnt"] or 0,
        "project_status_chart": {
            "Planning": proj_counts.get("PLANNING", 0),
            "Active": proj_counts.get("ACTIVE", 0),
            "On Hold": proj_counts.get("ON_HOLD", 0),
            "Completed": proj_counts.get("COMPLETED", 0),
            "Cancelled": proj_counts.get("CANCELLED", 0),
        },
    })


@monitoring_bp.route("/projects/<int:project_id>", methods=["GET"])
@login_required
def project_detail(project_id):
    project = query("SELECT * FROM projects WHERE id = %s", (project_id,), fetchone=True)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    task_stats = query(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status != 'COMPLETED' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
        FROM tasks WHERE project_id = %s
        """,
        (project_id,),
        fetchone=True,
    )
    total = task_stats["total"] or 0
    completed = task_stats["completed"] or 0
    progress_pct = round((completed / total * 100), 1) if total else 0

    health = calculate_project_health(project_id)

    upcoming = query(
        """
        SELECT id, title, due_date FROM tasks
        WHERE project_id = %s AND status != 'COMPLETED' AND due_date >= CURDATE()
        ORDER BY due_date ASC LIMIT 5
        """,
        (project_id,),
    )

    query(
        "INSERT INTO project_health_log (project_id, health, reason) VALUES (%s, %s, %s)",
        (project_id, health["health"], "; ".join(health["reasons"])),
        commit=True,
    )

    return jsonify({
        "project": project,
        "progress": {
            "total_tasks": total,
            "completed_tasks": completed,
            "task_completion_pct": progress_pct,
        },
        "health": health,
        "upcoming_deadlines": upcoming,
    })


@monitoring_bp.route("/teams/<int:team_id>", methods=["GET"])
@login_required
def team_detail(team_id):
    # FIX (merge): `teams.lead_id` doesn't exist -- Part 2's real column is
    # `team_lead_id` (sql/schema.sql).
    team = query(
        """
        SELECT t.*, u.name AS lead_name
        FROM teams t LEFT JOIN users u ON u.id = t.team_lead_id
        WHERE t.id = %s
        """,
        (team_id,),
        fetchone=True,
    )
    if not team:
        return jsonify({"error": "Team not found"}), 404

    # FIX (merge): `users.team_id` doesn't exist -- team membership lives in
    # Part 2's `team_members` join table (a developer can belong to several
    # teams), not a column on `users`.
    dev_count = query(
        """
        SELECT COUNT(*) AS cnt
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = %s AND u.role = 'DEVELOPER'
        """,
        (team_id,),
        fetchone=True,
    )

    task_stats = query(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status='BLOCKED' THEN 1 ELSE 0 END) AS blocked,
            SUM(CASE WHEN status != 'COMPLETED' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue
        FROM tasks WHERE team_id = %s
        """,
        (team_id,),
        fetchone=True,
    )
    total = task_stats["total"] or 0
    completed = task_stats["completed"] or 0

    open_bugs = query(
        """
        SELECT COUNT(*) AS cnt FROM bugs b
        JOIN tasks t ON t.id = b.task_id
        WHERE t.team_id = %s AND b.status NOT IN ('CLOSED','REJECTED')
        """,
        (team_id,),
        fetchone=True,
    )

    return jsonify({
        "team_name": team["name"],
        "team_lead": team["lead_name"],
        "developers": dev_count["cnt"] or 0,
        "tasks": total,
        "completed": completed,
        "in_progress": task_stats["in_progress"] or 0,
        "blocked": task_stats["blocked"] or 0,
        "overdue": task_stats["overdue"] or 0,
        "progress_pct": round((completed / total * 100), 1) if total else 0,
        "open_bugs": open_bugs["cnt"] or 0,
    })


@monitoring_bp.route("/developers/<int:user_id>", methods=["GET"])
@login_required
def developer_detail(user_id):
    dev = query("SELECT id, name, role FROM users WHERE id = %s", (user_id,), fetchone=True)
    if not dev:
        return jsonify({"error": "Developer not found"}), 404

    stats = query(
        """
        SELECT
            COUNT(*) AS assigned,
            SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status='IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status='BLOCKED' THEN 1 ELSE 0 END) AS blocked,
            SUM(CASE WHEN status != 'COMPLETED' AND due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue,
            AVG(CASE WHEN status='COMPLETED' AND completed_at IS NOT NULL
                     THEN TIMESTAMPDIFF(HOUR, created_at, completed_at) END) AS avg_completion_hours
        FROM tasks WHERE assigned_to = %s
        """,
        (user_id,),
        fetchone=True,
    )
    assigned = stats["assigned"] or 0
    completed = stats["completed"] or 0

    return jsonify({
        "developer": dev["name"],
        "assigned_tasks": assigned,
        "completed": completed,
        "in_progress": stats["in_progress"] or 0,
        "blocked": stats["blocked"] or 0,
        "overdue": stats["overdue"] or 0,
        "completion_pct": round((completed / assigned * 100), 1) if assigned else 0,
        "avg_completion_hours": round(stats["avg_completion_hours"], 1) if stats["avg_completion_hours"] else None,
    })


@monitoring_bp.route("/calendar", methods=["GET"])
@login_required
def calendar():
    """Combined calendar feed: task deadlines, bug deadlines/creation, testing dates."""
    project_id = request.args.get("project_id")
    team_id = request.args.get("team_id")

    task_sql = "SELECT id, title, due_date AS date, 'TASK_DEADLINE' AS type, project_id FROM tasks WHERE due_date IS NOT NULL"
    params = []
    if project_id:
        task_sql += " AND project_id = %s"
        params.append(project_id)
    if team_id:
        task_sql += " AND team_id = %s"
        params.append(team_id)
    tasks = query(task_sql, params)

    bug_sql = "SELECT id, title, created_at AS date, 'BUG_REPORTED' AS type, project_id FROM bugs WHERE 1=1"
    bparams = []
    if project_id:
        bug_sql += " AND project_id = %s"
        bparams.append(project_id)
    bugs = query(bug_sql, bparams)

    return jsonify({"tasks": tasks, "bugs": bugs})
