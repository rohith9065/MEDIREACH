import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import { findHospitalIdForUser } from "../models/hospital.model";
import { ROLES } from "../../../shared/constants/roles";

let ioInstance: SocketIOServer | null = null;

// Services emit through this instead of threading `io` through every function call — a
// small singleton registry, set once here and read by hospital.service.ts. Returns null
// (rather than throwing) when no server has been initialized — most tests build the Express
// app directly via createApp() without ever calling initSockets, and REST behavior shouldn't
// depend on a socket server existing.
export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function hospitalRoom(hospitalId: string): string {
  return `hospital:${hospitalId}`;
}

export function driverRoom(userId: string): string {
  return `driver:${userId}`;
}

export function ambulanceRequestRoom(requestId: string): string {
  return `ambulance-request:${requestId}`;
}

export function initSockets(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });
  ioInstance = io;

  io.on("connection", (socket: Socket) => {
    void handleConnection(socket);

    socket.on("subscribe:hospital", ({ hospitalId }: { hospitalId?: string } = {}, ack?: () => void) => {
      if (typeof hospitalId === "string" && hospitalId.length > 0) {
        socket.join(hospitalRoom(hospitalId));
      }
      ack?.();
    });

    socket.on("unsubscribe:hospital", ({ hospitalId }: { hospitalId?: string } = {}) => {
      if (typeof hospitalId === "string" && hospitalId.length > 0) {
        socket.leave(hospitalRoom(hospitalId));
      }
    });

    // Both the requesting patient and the assigned driver join the same request's room —
    // patient right after creating the request, driver right after accepting it.
    socket.on("subscribe:ambulanceRequest", ({ requestId }: { requestId?: string } = {}, ack?: () => void) => {
      if (typeof requestId === "string" && requestId.length > 0) {
        socket.join(ambulanceRequestRoom(requestId));
      }
      ack?.();
    });

    socket.on("unsubscribe:ambulanceRequest", ({ requestId }: { requestId?: string } = {}) => {
      if (typeof requestId === "string" && requestId.length > 0) {
        socket.leave(ambulanceRequestRoom(requestId));
      }
    });
  });

  return io;
}

// Hospital-admin and ambulance-driver clients authenticate with the same JWT they already log
// in with, and are auto-joined to their own room — mirrors attachHospitalContext's HTTP
// behavior. Anonymous/patient clients skip this entirely and use subscribe:hospital /
// subscribe:ambulanceRequest instead.
async function handleConnection(socket: Socket): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.role === ROLES.AMBULANCE_DRIVER) {
      socket.join(driverRoom(payload.sub));
      return;
    }
    const hospitalId = await findHospitalIdForUser(payload.sub);
    if (hospitalId) {
      socket.join(hospitalRoom(hospitalId));
    }
  } catch {
    socket.emit("auth:error", { message: "Could not authenticate this socket connection" });
    socket.disconnect(true);
  }
}
