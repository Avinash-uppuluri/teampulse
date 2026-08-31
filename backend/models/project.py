from datetime import date
from extensions import db

PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED", "ARCHIVED"]
PROJECT_HEALTH = ["GREEN", "YELLOW", "RED"]
PROJECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    project_code = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))

    manager_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)

    priority = db.Column(db.Enum(*PROJECT_PRIORITIES), default="MEDIUM", nullable=False)
    status = db.Column(db.Enum(*PROJECT_STATUSES), default="PLANNING", nullable=False)
    health = db.Column(db.Enum(*PROJECT_HEALTH), default="GREEN", nullable=False)

    budget = db.Column(db.Numeric(14, 2))
    department = db.Column(db.String(100))

    is_archived = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    teams = db.relationship("Team", backref="project", cascade="all, delete-orphan", lazy="dynamic")
    milestones = db.relationship("Milestone", backref="project", cascade="all, delete-orphan", lazy="dynamic")
    activities = db.relationship("ProjectActivity", backref="project", cascade="all, delete-orphan", lazy="dynamic")

    manager = db.relationship("User", foreign_keys=[manager_id])
    client = db.relationship("User", foreign_keys=[client_id])

    # -- derived / computed helpers ------------------------------------

    @property
    def progress(self):
        """Aggregate progress % derived from milestone completion.
        Part 3 (tasks) may later provide a more granular figure; this is
        the Part-2-owned fallback so the UI always has something to show.
        """
        milestones = self.milestones.all()
        if not milestones:
            return 0
        total = sum(m.progress for m in milestones)
        return round(total / len(milestones))

    @property
    def is_delayed(self):
        if not self.end_date:
            return False
        if self.status in ("COMPLETED", "CANCELLED", "ARCHIVED"):
            return False
        return self.end_date < date.today()

    @property
    def is_at_risk(self):
        return self.health in ("YELLOW", "RED") and self.status not in (
            "COMPLETED", "CANCELLED", "ARCHIVED"
        )

    def team_member_count(self):
        from .team import TeamMember, Team
        return (
            db.session.query(TeamMember)
            .join(Team, Team.id == TeamMember.team_id)
            .filter(Team.project_id == self.id)
            .count()
        )

    def to_dict(self, include_relations=False):
        data = {
            "id": self.id,
            "name": self.name,
            "project_code": self.project_code,
            "description": self.description,
            "category": self.category,
            "manager_id": self.manager_id,
            "manager": self.manager.to_summary() if self.manager else None,
            "client_id": self.client_id,
            "client": self.client.to_summary() if self.client else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "priority": self.priority,
            "status": self.status,
            "health": self.health,
            "budget": float(self.budget) if self.budget is not None else None,
            "department": self.department,
            "is_archived": self.is_archived,
            "progress": self.progress,
            "is_delayed": self.is_delayed,
            "is_at_risk": self.is_at_risk,
            "team_count": self.teams.count(),
            "team_member_count": self.team_member_count(),
            "milestone_count": self.milestones.count(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_relations:
            data["teams"] = [t.to_dict(include_members=True) for t in self.teams]
            data["milestones"] = [m.to_dict() for m in self.milestones]
        return data
