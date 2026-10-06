import { io, Socket } from "socket.io-client";
import { getToken } from "./apiClient";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";
// Socket.IO mounts at the server root (its own /socket.io path), not under /api.
const SOCKET_ORIGIN = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_ORIGIN, { transports: ["websocket"], autoConnect: false });
  }
  return socket;
}

// Unlike patient-mobile's anonymous socket, a driver's connection must carry their JWT so the
// server auto-joins them to their personal driver:<userId> room (see server/src/sockets/index.ts)
// and can push ambulance:incoming-request straight to them.
export async function connectSocket(): Promise<Socket> {
  const s = getSocket();
  s.auth = { token: await getToken() };
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function getConnectedSocket(): Socket {
  return getSocket();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
