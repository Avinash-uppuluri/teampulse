"""
Query helper for Part 4's raw-SQL routes (qa, bugs, monitoring, reports,
client). Part 4 originally kept its own separate MySQL connection pool
(db.py) configured from MYSQL_HOST/MYSQL_USER/... env vars, distinct from
Part 1's db_pool.py (DB_HOST/DB_USER/...). On merge there is exactly one
database and one set of credentials, so this wraps the single shared pool
in db_pool.py behind the same `query()` interface Part 4's routes call.
"""

from db_pool import get_connection


def query(sql, params=None, fetchone=False, commit=False):
    conn = get_connection()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params or ())
        if commit:
            conn.commit()
            last_id = cur.lastrowid
            cur.close()
            return last_id
        rows = cur.fetchone() if fetchone else cur.fetchall()
        cur.close()
        return rows
    finally:
        conn.close()
