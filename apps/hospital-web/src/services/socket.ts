import { io, Socket } from "socket.io-client";
import { getToken } from "./apiClient";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
// Socket.IO mounts at the server root (its own /socket.io path), not under /api.
const SOCKET_ORIGIN = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_ORIGIN, { autoConnect: false });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  // Refresh the auth token in case it changed (e.g. login happened after the socket was
  // first created) since Socket.IO reads `auth` only at connect time.
  s.auth = { token: getToken() };
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
