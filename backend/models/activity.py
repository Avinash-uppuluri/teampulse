from extensions import db


class ProjectActivity(db.Model):
    __tablename__ = "project_activity"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user": self.user.to_summary() if self.user else None,
            "action": self.action,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @staticmethod
    def log(project_id, user_id, action, details=None):
        entry = ProjectActivity(
            project_id=project_id, user_id=user_id, action=action, details=details
        )
        db.session.add(entry)
        return entry
