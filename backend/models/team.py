from extensions import db


class Team(db.Model):
    __tablename__ = "teams"
    __table_args__ = (
        db.UniqueConstraint("project_id", "name", name="uq_team_name_per_project"),
    )

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    team_lead_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    is_archived = db.Column(db.Boolean, default=False, nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    members = db.relationship("TeamMember", backref="team", cascade="all, delete-orphan", lazy="dynamic")
    team_lead = db.relationship("User", foreign_keys=[team_lead_id])

    def to_dict(self, include_members=False):
        data = {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "team_lead_id": self.team_lead_id,
            "team_lead": self.team_lead.to_summary() if self.team_lead else None,
            "member_count": self.members.count(),
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_members:
            data["members"] = [m.to_dict() for m in self.members]
        return data


class TeamMember(db.Model):
    __tablename__ = "team_members"
    __table_args__ = (
        db.UniqueConstraint("team_id", "user_id", name="uq_team_member"),
    )

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    joined_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "user_id": self.user_id,
            "user": self.user.to_summary() if self.user else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }
