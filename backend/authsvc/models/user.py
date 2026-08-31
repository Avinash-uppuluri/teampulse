"""
User data-access layer. All raw SQL for the `users` table lives here
so every other module can reuse it instead of writing its own queries
(and instead of creating a second users table).
"""

from db_pool import get_connection

ALLOWED_ROLES = [
    "ADMIN",
    "PROJECT_MANAGER",
    "TEAM_LEAD",
    "DEVELOPER",
    "QA_TESTER",
    "CLIENT",
]

# Columns that are safe to send to the frontend (never include password_hash)
PUBLIC_COLUMNS = (
    "id, name, email, role, department, profile_image, status, "
    "last_login, created_at, updated_at"
)


class UserModel:
    @staticmethod
    def create(name, email, password_hash, role, department=None):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO users (name, email, password_hash, role, department, status)
                VALUES (%s, %s, %s, %s, %s, 'ACTIVE')
                """,
                (name, email, password_hash, role, department),
            )
            conn.commit()
            new_id = cur.lastrowid
            cur.close()
            return new_id
        finally:
            conn.close()

    @staticmethod
    def find_by_email(email):
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT * FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            cur.close()
            return row
        finally:
            conn.close()

    @staticmethod
    def find_by_id(user_id, public_only=True):
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cols = PUBLIC_COLUMNS if public_only else "*"
            cur.execute(f"SELECT {cols} FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            cur.close()
            return row
        finally:
            conn.close()

    @staticmethod
    def list_users(search=None, role=None, status=None, page=1, per_page=10):
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)

            where_clauses = []
            params = []

            if search:
                where_clauses.append("(name LIKE %s OR email LIKE %s)")
                like = f"%{search}%"
                params.extend([like, like])

            if role:
                where_clauses.append("role = %s")
                params.append(role)

            if status:
                where_clauses.append("status = %s")
                params.append(status)

            where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

            count_sql = f"SELECT COUNT(*) AS total FROM users {where_sql}"
            cur.execute(count_sql, tuple(params))
            total = cur.fetchone()["total"]

            offset = (page - 1) * per_page
            data_sql = (
                f"SELECT {PUBLIC_COLUMNS} FROM users {where_sql} "
                f"ORDER BY created_at DESC LIMIT %s OFFSET %s"
            )
            cur.execute(data_sql, tuple(params) + (per_page, offset))
            rows = cur.fetchall()
            cur.close()
            return rows, total
        finally:
            conn.close()

    @staticmethod
    def update(user_id, fields: dict):
        if not fields:
            return False
        conn = get_connection()
        try:
            cur = conn.cursor()
            set_sql = ", ".join(f"{k} = %s" for k in fields.keys())
            params = list(fields.values()) + [user_id]
            cur.execute(
                f"UPDATE users SET {set_sql}, updated_at = NOW() WHERE id = %s",
                params,
            )
            conn.commit()
            affected = cur.rowcount
            cur.close()
            return affected > 0
        finally:
            conn.close()

    @staticmethod
    def update_status(user_id, status):
        return UserModel.update(user_id, {"status": status})

    @staticmethod
    def update_password(user_id, password_hash):
        return UserModel.update(user_id, {"password_hash": password_hash})

    @staticmethod
    def update_last_login(user_id):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,)
            )
            conn.commit()
            cur.close()
        finally:
            conn.close()

    @staticmethod
    def delete(user_id):
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            affected = cur.rowcount
            cur.close()
            return affected > 0
        finally:
            conn.close()

    @staticmethod
    def get_stats():
        conn = get_connection()
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute(
                """
                SELECT
                  COUNT(*) AS total_users,
                  SUM(status = 'ACTIVE') AS active_users,
                  SUM(status = 'INACTIVE') AS inactive_users,
                  SUM(role = 'PROJECT_MANAGER') AS project_managers,
                  SUM(role = 'TEAM_LEAD') AS team_leads,
                  SUM(role = 'DEVELOPER') AS developers,
                  SUM(role = 'QA_TESTER') AS qa_testers,
                  SUM(role = 'CLIENT') AS clients
                FROM users
                """
            )
            row = cur.fetchone()
            cur.close()
            return row
        finally:
            conn.close()
