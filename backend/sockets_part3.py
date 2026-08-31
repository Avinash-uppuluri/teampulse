"""
Socket.IO wiring for Part 3.

Events emitted from routes (see tasks.py, submissions.py, comments.py):
  taskCreated, taskUpdated, taskAssigned, taskCompleted, taskBlocked, taskSubmitted

Clients just need to connect and listen; no server-authoritative game loop
is required here, so the only thing we do server-side is log connections
and optionally let clients join a "team:<id>" room to scope traffic.
"""

from flask_socketio import join_room, leave_room

from extensions import socketio


@socketio.on("connect")
def handle_connect():
    print("Client connected to Part 3 task socket")


@socketio.on("joinTeamRoom")
def handle_join_team(data):
    team_id = data.get("team_id")
    if team_id:
        join_room(f"team:{team_id}")


@socketio.on("leaveTeamRoom")
def handle_leave_team(data):
    team_id = data.get("team_id")
    if team_id:
        leave_room(f"team:{team_id}")


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected from Part 3 task socket")
