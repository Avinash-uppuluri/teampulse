import { useEffect } from "react";
import { io } from "socket.io-client";

// FIX (merge): pointed at a standalone :5003 dev server that no longer
// exists post-merge; the shared backend (and its Socket.IO server) now
// runs at VITE_SOCKET_URL / the same host as the REST API.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const EVENTS = [
  "taskCreated",
  "taskUpdated",
  "taskAssigned",
  "taskCompleted",
  "taskBlocked",
  "taskSubmitted",
];

/**
 * Subscribes to task-related Socket.IO events and calls `onEvent` whenever
 * one fires, so dashboards can refresh without a manual page reload.
 *
 * Usage:
 *   useTaskSocket(teamId, () => bump());
 */
export function useTaskSocket(teamId, onEvent) {
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    if (teamId) {
      socket.emit("joinTeamRoom", { team_id: teamId });
    }

    EVENTS.forEach((event) => socket.on(event, onEvent));

    return () => {
      if (teamId) socket.emit("leaveTeamRoom", { team_id: teamId });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);
}
