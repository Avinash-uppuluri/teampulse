"""
Scope checks that decide WHICH tasks a user is allowed to touch.

These helpers read team/project membership from Part 2's tables
(teams, team_members, projects, project_managers - names assumed to match
Part 2's schema; adjust the raw table/column names in one place here if
Part 2 differs).

Role summary (per spec):
- ADMIN: read-only, sees everything.
- PROJECT_MANAGER: read-only, sees tasks within projects they manage.
- TEAM_LEAD: full task management, but only within teams they lead.
- DEVELOPER: can only update tasks assigned to them.
- QA: read-only, sees tasks relevant to testing (their team/project).
- CLIENT: no access to internal task details unless explicitly permitted.
"""

from extensions import db
from sqlalchemy import text


def is_team_lead_of(user_id, team_id):
    row = db.session.execute(
        text("SELECT 1 FROM teams WHERE id = :team_id AND team_lead_id = :user_id"),
        {"team_id": team_id, "user_id": user_id},
    ).fetchone()
    return row is not None


def manages_project(user_id, project_id):
    """True if a PROJECT_MANAGER manages this project (Part 2 ownership)."""
    row = db.session.execute(
        text(
            "SELECT 1 FROM projects WHERE id = :project_id AND manager_id = :user_id"
        ),
        {"project_id": project_id, "user_id": user_id},
    ).fetchone()
    return row is not None


def is_member_of_team(user_id, team_id):
    row = db.session.execute(
        text(
            "SELECT 1 FROM team_members WHERE team_id = :team_id AND user_id = :user_id"
        ),
        {"team_id": team_id, "user_id": user_id},
    ).fetchone()
    return row is not None


def team_ids_led_by(user_id):
    rows = db.session.execute(
        text("SELECT id FROM teams WHERE team_lead_id = :user_id"), {"user_id": user_id}
    ).fetchall()
    return [r[0] for r in rows]


def can_view_task(current_user, task):
    role = current_user["role"]
    user_id = current_user["user_id"]

    if role == "ADMIN":
        return True
    if role == "PROJECT_MANAGER":
        return manages_project(user_id, task.project_id)
    if role == "TEAM_LEAD":
        return is_team_lead_of(user_id, task.team_id)
    if role == "DEVELOPER":
        return task.assigned_to == user_id
    if role == "QA":
        return is_member_of_team(user_id, task.team_id)
    if role == "CLIENT":
        return False
    return False


def can_manage_task(current_user, task):
    """Create/edit/delete/assign/reassign rights."""
    role = current_user["role"]
    user_id = current_user["user_id"]

    if role == "ADMIN":
        return False  # admin is explicitly read-only per spec
    if role == "TEAM_LEAD":
        return is_team_lead_of(user_id, task.team_id)
    return False


def can_create_task_for_team(current_user, team_id):
    role = current_user["role"]
    user_id = current_user["user_id"]
    if role != "TEAM_LEAD":
        return False
    return is_team_lead_of(user_id, team_id)


def can_update_own_task(current_user, task):
    """Developer's limited self-service update rights."""
    return (
        current_user["role"] == "DEVELOPER" and task.assigned_to == current_user["user_id"]
    )
