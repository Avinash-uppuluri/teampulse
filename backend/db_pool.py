"""
Lightweight MySQL connection pool.

Every module (Auth, Projects, Tasks, QA) should import get_connection()
from here (or a copy of this file) so all 4 parts talk to the SAME
centralized MySQL database, as required by the integration rules.
"""

import mysql.connector
from mysql.connector import pooling
from config import Config

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="teampulse_pool",
            pool_size=10,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
        )
    return _pool


def get_connection():
    """Returns a pooled MySQL connection. Caller is responsible for closing it."""
    return _get_pool().get_connection()
