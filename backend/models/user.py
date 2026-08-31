from extensions import db


class User(db.Model):
    """
    READ-ONLY mapping onto the centralized `users` table owned by Part 1
    (Authentication & Users) — see database/schema.sql.

    Parts 2/3/4 never create, migrate, or write to this table through
    SQLAlchemy; Part 1's own raw-SQL UserModel (backend/authsvc/models/user.py)
    remains the only writer. This model exists purely so the other parts'
    queries can join against real columns for display purposes.

    IMPORTANT: only declare columns that actually exist on `users`. The
    original Part 2 `UserRef` model declared a non-existent `is_active`
    boolean (the real column is `status` ENUM('ACTIVE','INACTIVE')) --
    fixed here.
    """

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(191))
    role = db.Column(db.String(50))
    department = db.Column(db.String(100))
    status = db.Column(db.String(20))  # 'ACTIVE' | 'INACTIVE'

    def to_summary(self):
        if self is None:
            return None
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
        }
