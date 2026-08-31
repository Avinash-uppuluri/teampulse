"""
TeamPulse — merged backend entrypoint.

Combines:
  Part 1  auth, admin              (backend/authsvc)
  Part 2  projects, teams, milestones
  Part 3  tasks, comments, submissions, developers, team insights
  Part 4  QA, bugs, monitoring, reports, client dashboard (+ Socket.IO)

See docs/INTEGRATION.md (carried over from Part 2) for the original merge
plan this follows, and MERGE_NOTES.md at the repo root for the bugs that
were found and fixed while doing this merge.
"""

from flask import Flask

from config import Config
from extensions import db, jwt, cors, socketio


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(
        app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}}, supports_credentials=True
    )
    socketio.init_app(app)

    # ---- Part 1: Auth & Admin (raw-SQL, own connection pool) ----------
    from authsvc.routes.auth_routes import auth_bp
    from authsvc.routes.admin_routes import admin_bp

    # ---- Part 2: Projects / Teams / Milestones (SQLAlchemy) -----------
    from routes.projects import projects_bp
    from routes.project_teams import teams_bp
    from routes.milestones import milestones_bp

    # ---- Part 3: Tasks (SQLAlchemy) ------------------------------------
    from routes.tasks import tasks_bp
    from routes.comments import comments_bp
    from routes.submissions import submissions_bp
    from routes.developers import developers_bp
    from routes.team_insights import team_insights_bp

    # ---- Part 4: QA / Bugs / Monitoring / Reports / Client (raw-SQL) --
    from routes.qa import qa_bp
    from routes.bugs import bugs_bp
    from routes.monitoring import monitoring_bp
    from routes.reports import reports_bp
    from routes.client import client_bp

    for bp in (
        auth_bp,
        admin_bp,
        projects_bp,
        teams_bp,
        milestones_bp,
        tasks_bp,
        comments_bp,
        submissions_bp,
        developers_bp,
        team_insights_bp,
        qa_bp,
        bugs_bp,
        monitoring_bp,
        reports_bp,
        client_bp,
    ):
        app.register_blueprint(bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"status": "ok", "service": "teampulse-backend"}

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "NOT_FOUND", "message": "Resource not found."}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"error": "METHOD_NOT_ALLOWED", "message": "Method not allowed."}, 405

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "SERVER_ERROR", "message": "Internal server error."}, 500

    # Part 3's Socket.IO handlers (task events) attach to the shared instance.
    import sockets_part3  # noqa: F401

    return app


app = create_app()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=Config.APP_PORT, debug=Config.DEBUG)
