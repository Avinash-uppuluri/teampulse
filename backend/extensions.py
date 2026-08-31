"""
One shared instance of each extension, per INTEGRATION.md's merge rules
(don't call db.init_app() twice, one JWTManager, one CORS instance).
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*")
