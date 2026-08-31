from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Project, Team, TeamMember, ProjectActivity, User
from utils.auth import require_auth, require_roles
from utils.helpers import error_response, user_can_access_project

teams_bp = Blueprint("teams", __name__)


def _pm_owns_project_or_admin(user, project):
    if user["role"] == "ADMIN":
        return True
    return user["role"] == "PROJECT_MANAGER" and project.manager_id == user["id"]


# =====================================================================
# POST /api/projects/:id/teams
# =====================================================================
@teams_bp.route("/api/projects/<int:project_id>/teams", methods=["POST"])
@require_roles("PROJECT_MANAGER")
def create_team(project_id):
    project = Project.query.get_or_404(project_id)
    user = g.current_user
    if not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage teams on projects you own.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return error_response("`name` is required.")

    if Team.query.filter_by(project_id=project_id, name=name).first():
        return error_response("A team with this name already exists on this project.", 409, "CONFLICT")

    team_lead_id = data.get("team_lead_id")
    if team_lead_id:
        lead = User.query.get(team_lead_id)
        if not lead:
            return error_response("team_lead_id does not reference a valid user.")

    team = Team(
        project_id=project_id,
        name=name,
        description=data.get("description"),
        team_lead_id=team_lead_id,
    )
    db.session.add(team)
    db.session.flush()

    ProjectActivity.log(project_id, user["id"], "TEAM_ADDED", f'Team "{name}" created')
    db.session.commit()

    return jsonify(team.to_dict(include_members=True)), 201


# =====================================================================
# GET /api/projects/:id/teams
# =====================================================================
@teams_bp.route("/api/projects/<int:project_id>/teams", methods=["GET"])
@require_auth
def list_teams(project_id):
    project = Project.query.get_or_404(project_id)
    if not user_can_access_project(g.current_user, project):
        return error_response("You do not have access to this project.", 403, "FORBIDDEN")

    teams = Team.query.filter_by(project_id=project_id, is_archived=False).all()
    return jsonify([t.to_dict(include_members=True) for t in teams])


# =====================================================================
# GET /api/teams/:id  (single team, with members)
# =====================================================================
@teams_bp.route("/api/teams/<int:team_id>", methods=["GET"])
@require_auth
def get_team(team_id):
    team = Team.query.get_or_404(team_id)
    project = team.project
    user = g.current_user

    # Team leads / developers can only view teams they belong to.
    if user["role"] == "TEAM_LEAD" and team.team_lead_id != user["id"]:
        return error_response("You can only view your own team.", 403, "FORBIDDEN")
    if user["role"] == "DEVELOPER" and not any(m.user_id == user["id"] for m in team.members):
        return error_response("You do not have access to this team.", 403, "FORBIDDEN")
    if user["role"] in ("PROJECT_MANAGER", "CLIENT") and not user_can_access_project(user, project):
        return error_response("You do not have access to this team.", 403, "FORBIDDEN")

    return jsonify(team.to_dict(include_members=True))


# =====================================================================
# PUT /api/teams/:id
# =====================================================================
@teams_bp.route("/api/teams/<int:team_id>", methods=["PUT"])
@require_roles("PROJECT_MANAGER")
def update_team(team_id):
    team = Team.query.get_or_404(team_id)
    project = team.project
    user = g.current_user
    if not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage teams on projects you own.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}

    if "name" in data and data["name"]:
        team.name = data["name"].strip()
    if "description" in data:
        team.description = data["description"]
    if "team_lead_id" in data:
        new_lead_id = data["team_lead_id"]
        if new_lead_id:
            lead = User.query.get(new_lead_id)
            if not lead:
                return error_response("team_lead_id does not reference a valid user.")
        team.team_lead_id = new_lead_id

    ProjectActivity.log(project.id, user["id"], "TEAM_UPDATED", f'Team "{team.name}" updated')
    db.session.commit()
    return jsonify(team.to_dict(include_members=True))


# =====================================================================
# DELETE /api/teams/:id  (archive, non-destructive by default)
# =====================================================================
@teams_bp.route("/api/teams/<int:team_id>", methods=["DELETE"])
@require_roles("PROJECT_MANAGER")
def delete_team(team_id):
    team = Team.query.get_or_404(team_id)
    project = team.project
    user = g.current_user
    if not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage teams on projects you own.", 403, "FORBIDDEN")

    hard_delete = request.args.get("hard", "false").lower() == "true"
    if hard_delete:
        db.session.delete(team)
        action = "TEAM_DELETED"
    else:
        team.is_archived = True
        action = "TEAM_ARCHIVED"

    ProjectActivity.log(project.id, user["id"], action, f'Team "{team.name}"')
    db.session.commit()
    return jsonify({"message": "Team removed."}), 200


# =====================================================================
# POST /api/teams/:id/members
# =====================================================================
@teams_bp.route("/api/teams/<int:team_id>/members", methods=["POST"])
@require_roles("PROJECT_MANAGER", "TEAM_LEAD")
def add_team_member(team_id):
    team = Team.query.get_or_404(team_id)
    project = team.project
    user = g.current_user

    if user["role"] == "PROJECT_MANAGER" and not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage teams on projects you own.", 403, "FORBIDDEN")
    if user["role"] == "TEAM_LEAD" and team.team_lead_id != user["id"]:
        return error_response("You can only add developers to your own team.", 403, "FORBIDDEN")

    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("user_id")
    if not user_id:
        return error_response("`user_id` is required.")

    developer = User.query.get(user_id)
    if not developer:
        return error_response("user_id does not reference a valid user.")

    if TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first():
        return error_response("This user is already a member of the team.", 409, "CONFLICT")

    member = TeamMember(team_id=team_id, user_id=user_id)
    db.session.add(member)

    ProjectActivity.log(
        project.id, user["id"], "MEMBER_ADDED",
        f'{developer.name or ("User #" + str(user_id))} added to team "{team.name}"'
    )
    db.session.commit()
    return jsonify(member.to_dict()), 201


# =====================================================================
# DELETE /api/teams/:id/members/:userId
# =====================================================================
@teams_bp.route("/api/teams/<int:team_id>/members/<int:user_id>", methods=["DELETE"])
@require_roles("PROJECT_MANAGER", "TEAM_LEAD")
def remove_team_member(team_id, user_id):
    team = Team.query.get_or_404(team_id)
    project = team.project
    user = g.current_user

    if user["role"] == "PROJECT_MANAGER" and not _pm_owns_project_or_admin(user, project):
        return error_response("You can only manage teams on projects you own.", 403, "FORBIDDEN")
    if user["role"] == "TEAM_LEAD" and team.team_lead_id != user["id"]:
        return error_response("You can only remove developers from your own team.", 403, "FORBIDDEN")

    member = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    if not member:
        return error_response("This user is not a member of the team.", 404, "NOT_FOUND")

    db.session.delete(member)
    ProjectActivity.log(project.id, user["id"], "MEMBER_REMOVED", f'User #{user_id} removed from team "{team.name}"')
    db.session.commit()
    return jsonify({"message": "Member removed."}), 200


# =====================================================================
# GET /api/team-leads/:id/developers
# Scoped helper: a team lead only ever sees developers on THEIR teams.
# =====================================================================
@teams_bp.route("/api/team-leads/<int:lead_id>/developers", methods=["GET"])
@require_auth
def team_lead_developers(lead_id):
    user = g.current_user
    if user["role"] not in ("ADMIN", "PROJECT_MANAGER") and user["id"] != lead_id:
        return error_response("You can only view your own team's developers.", 403, "FORBIDDEN")

    teams = Team.query.filter_by(team_lead_id=lead_id, is_archived=False).all()
    result = []
    seen_user_ids = set()
    for team in teams:
        for member in team.members:
            if member.user_id in seen_user_ids:
                continue
            seen_user_ids.add(member.user_id)
            entry = member.to_dict()
            entry["team_id"] = team.id
            entry["team_name"] = team.name
            entry["project_id"] = team.project_id
            result.append(entry)

    return jsonify(result)
