import { io } from "socket.io-client";

// FIX (merge): pointed at a standalone :5001 dev server that no longer
// exists post-merge; same shared backend/socket host as ../utils/useTaskSocket.js.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
}

// Usage in a component:
//   useEffect(() => {
//     const s = getSocket();
//     s.on('bugCreated', handler);
//     return () => s.off('bugCreated', handler);
//   }, []);
