import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """
    Single source of truth for the merged app. Reconciles four different
    env-var naming schemes from the standalone parts:
      - Part 1/2/3 used DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
      - Part 4 used MYSQL_HOST/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DB
    Both are read here (MYSQL_* as a fallback) so an existing .env from any
    one part still works; new setups should just use DB_*.
    """

    # ---- Database (one shared MySQL instance/schema for all parts) -----
    DB_HOST = os.getenv("DB_HOST", os.getenv("MYSQL_HOST", "localhost"))
    DB_PORT = int(os.getenv("DB_PORT", os.getenv("MYSQL_PORT", 3306)))
    DB_USER = os.getenv("DB_USER", os.getenv("MYSQL_USER", "root"))
    DB_PASSWORD = os.getenv("DB_PASSWORD", os.getenv("MYSQL_PASSWORD", ""))
    DB_NAME = os.getenv("DB_NAME", os.getenv("MYSQL_DB", "teampulse_db"))

    # Used by db_pool.py / db_helpers.py (raw mysql.connector, Part 1 + Part 4)
    # Used by SQLAlchemy (Part 2 + Part 3)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}

    # ---- JWT -------------------------------------------------------------
    # One secret, one signer (Part 1's /api/auth/login), verified everywhere
    # else via flask_jwt_extended. Reconciles JWT_SECRET_KEY (Parts 1/2) and
    # JWT_SECRET (Parts 3/4) -- both names are honored.
    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY", os.getenv("JWT_SECRET", "dev-secret-change-me")
    )
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", 480))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # ---- CORS --------------------------------------------------------
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # ---- App -----------------------------------------------------------
    DEBUG = os.getenv("FLASK_DEBUG", "1") in ("1", "true", "True")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    APP_PORT = int(os.getenv("APP_PORT", os.getenv("PORT", 5000)))

    # Single source of truth for roles across every part (Part 1's list).
    ROLES = [
        "ADMIN",
        "PROJECT_MANAGER",
        "TEAM_LEAD",
        "DEVELOPER",
        "QA_TESTER",
        "CLIENT",
    ]


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
