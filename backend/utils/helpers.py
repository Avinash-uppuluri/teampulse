from datetime import datetime
from flask import jsonify


def error_response(message, status=400, code=None):
    payload = {"error": code or "BAD_REQUEST", "message": message}
    return jsonify(payload), status


def parse_date(value):
    """Parses 'YYYY-MM-DD' into a date object, or returns None."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValueError(f"Invalid date format for '{value}', expected YYYY-MM-DD")


def paginate_query(query, request_args, default_per_page=20, max_per_page=100):
    try:
        page = max(1, int(request_args.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        per_page = int(request_args.get("per_page", default_per_page))
    except (TypeError, ValueError):
        per_page = default_per_page
    per_page = max(1, min(per_page, max_per_page))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return pagination


def user_can_access_project(user, project):
    """
    Enforces the role hierarchy for read access to a project:
      ADMIN               -> all projects
      PROJECT_MANAGER      -> projects they manage
      TEAM_LEAD             -> projects containing a team they lead
      DEVELOPER               -> projects containing a team they're a member of
      CLIENT                   -> projects where they are the client
    """
    role = user["role"]
    uid = user["id"]

    if role == "ADMIN":
        return True
    if role == "PROJECT_MANAGER":
        return project.manager_id == uid
    if role == "CLIENT":
        return project.client_id == uid
    if role == "TEAM_LEAD":
        return any(t.team_lead_id == uid for t in project.teams)
    if role == "DEVELOPER":
        for t in project.teams:
            if any(m.user_id == uid for m in t.members):
                return True
        return False
    return False


def scope_projects_query(query, user, ProjectModel, TeamModel, TeamMemberModel):
    """
    Applies role-based filtering directly at the query level (used by
    the list endpoint so pagination/counts stay correct).
    """
    role = user["role"]
    uid = user["id"]

    if role == "ADMIN":
        return query
    if role == "PROJECT_MANAGER":
        return query.filter(ProjectModel.manager_id == uid)
    if role == "CLIENT":
        return query.filter(ProjectModel.client_id == uid)
    if role == "TEAM_LEAD":
        return (
            query.join(TeamModel, TeamModel.project_id == ProjectModel.id)
            .filter(TeamModel.team_lead_id == uid)
            .distinct()
        )
    if role == "DEVELOPER":
        return (
            query.join(TeamModel, TeamModel.project_id == ProjectModel.id)
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
            .filter(TeamMemberModel.user_id == uid)
            .distinct()
        )
    # Unknown role: no access
    return query.filter(False)
