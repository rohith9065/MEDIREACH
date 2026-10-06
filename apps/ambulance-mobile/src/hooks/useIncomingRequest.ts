import { useEffect, useState } from "react";
import { connectSocket, getConnectedSocket } from "../services/socket";
import { AmbulanceRequestDetail } from "../../../../shared/types/ambulance";

// Listens on the auto-joined personal driver room (server/src/sockets/index.ts joins it from
// the JWT on connect) — no explicit subscribe needed, unlike the hospital/ambulance-request
// rooms which are opt-in.
export function useIncomingRequest(enabled: boolean) {
  const [incoming, setIncoming] = useState<AmbulanceRequestDetail | null>(null);

  useEffect(() => {
    if (!enabled) return;
    connectSocket();
    const socket = getConnectedSocket();
    const handler = (detail: AmbulanceRequestDetail) => setIncoming(detail);
    socket.on("ambulance:incoming-request", handler);
    return () => {
      socket.off("ambulance:incoming-request", handler);
    };
  }, [enabled]);

  return { incoming, clearIncoming: () => setIncoming(null) };
}
