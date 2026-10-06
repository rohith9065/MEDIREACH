import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";
// Socket.IO mounts at the server root (its own /socket.io path), not under /api.
const SOCKET_ORIGIN = API_URL.replace(/\/api\/?$/, "");

let socket: Socket | null = null;

// No auth needed — patient clients only ever join public hospital rooms via
// subscribe:hospital, same data the public /api/hospitals/* endpoints already expose.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_ORIGIN, { transports: ["websocket"] });
  }
  return socket;
}
