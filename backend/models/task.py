"""
Models owned by Part 3: Task, TaskComment, TaskSubmission, TaskDependency.

The User / Project / Team / TeamMember classes below are THIN, READ-ONLY
mirrors of tables owned by Part 1 and Part 2. They exist only so we can
`db.session.query(...).join(...)` against those tables for names/labels.
Part 3 never creates, alters, or seeds these tables (see schema.sql:
only the four Part-3 tables are in `CREATE TABLE` statements).
"""

from datetime import datetime

from extensions import db
from models.user import User  # noqa: F401  (re-exported for callers that did `from models import User`)
from models.project import Project  # noqa: F401
from models.team import Team, TeamMember  # noqa: F401


# ---------------------------------------------------------------------------
# Read-only mirrors of Part 1 / Part 2 tables (no migrations issued for these)
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Tables owned by Part 3
# ---------------------------------------------------------------------------
class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    priority = db.Column(
        db.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="task_priority"),
        default="MEDIUM",
        nullable=False,
    )
    status = db.Column(
        db.Enum(
            "NOT_STARTED",
            "IN_PROGRESS",
            "IN_REVIEW",
            "COMPLETED",
            "BLOCKED",
            name="task_status",
        ),
        default="NOT_STARTED",
        nullable=False,
    )
    progress = db.Column(db.Integer, default=0)  # 0-100

    start_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    estimated_hours = db.Column(db.Numeric(6, 2))
    actual_hours = db.Column(db.Numeric(6, 2), default=0)

    category = db.Column(db.String(80))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    comments = db.relationship(
        "TaskComment", backref="task", cascade="all, delete-orphan", lazy="dynamic"
    )
    submissions = db.relationship(
        "TaskSubmission", backref="task", cascade="all, delete-orphan", lazy="dynamic"
    )

    def is_overdue(self):
        if self.status == "COMPLETED" or not self.due_date:
            return False
        return self.due_date < datetime.utcnow().date()

    def to_dict(self, include_dependencies=True):
        data = {
            "id": self.id,
            "project_id": self.project_id,
            "team_id": self.team_id,
            "title": self.title,
            "description": self.description,
            "assigned_to": self.assigned_to,
            "created_by": self.created_by,
            "priority": self.priority,
            "status": self.status,
            "progress": self.progress,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "estimated_hours": float(self.estimated_hours) if self.estimated_hours is not None else None,
            "actual_hours": float(self.actual_hours) if self.actual_hours is not None else None,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "is_overdue": self.is_overdue(),
        }
        if include_dependencies:
            data["depends_on"] = [
                d.depends_on_task_id for d in self.dependency_links
            ]
        return data


class TaskDependency(db.Model):
    """Task B depends on Task A -> row(task_id=B, depends_on_task_id=A)."""

    __tablename__ = "task_dependencies"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    depends_on_task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("task_id", "depends_on_task_id", name="uq_task_dependency"),
    )


Task.dependency_links = db.relationship(
    "TaskDependency",
    foreign_keys=[TaskDependency.task_id],
    backref="dependent_task",
    cascade="all, delete-orphan",
    lazy="joined",
)


class TaskComment(db.Model):
    __tablename__ = "task_comments"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "user_id": self.user_id,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TaskSubmission(db.Model):
    __tablename__ = "task_submissions"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    submitted_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    description = db.Column(db.Text)
    submission_url = db.Column(db.String(500))
    file_path = db.Column(db.String(500), nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    review_status = db.Column(
        db.Enum("PENDING", "APPROVED", "CHANGES_REQUESTED", name="review_status"),
        default="PENDING",
    )
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "task_id": self.task_id,
            "submitted_by": self.submitted_by,
            "description": self.description,
            "submission_url": self.submission_url,
            "file_path": self.file_path,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "review_status": self.review_status,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_notes": self.review_notes,
        }
