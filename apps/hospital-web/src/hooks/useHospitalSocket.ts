import { useEffect } from "react";
import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { connectSocket, disconnectSocket } from "../services/socket";

// One admin session's worth of live updates for their own hospital (server auto-joins the
// hospital:<id> room on connect via the JWT). Mounted once from PortalLayout so every admin
// page benefits without each page wiring its own socket.
const EVENT_QUERY_KEYS: Record<string, QueryKey[]> = {
  "hospital:bed-updated": [["hospital", "beds"], ["hospital", "dashboard"]],
  "hospital:doctor-updated": [["hospital", "doctors"], ["hospital", "dashboard"]],
  "hospital:facility-updated": [["hospital", "facilities"], ["hospital", "dashboard"]],
  "hospital:emergency-updated": [["hospital", "me"], ["hospital", "dashboard"]],
  // Partial key — matches every ["hospital","queue",doctorId,date] query regardless of
  // which doctor/date is currently selected on the Queue page.
  "queue:updated": [["hospital", "queue"]],
};

export function useHospitalSocket(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();
    const handlers: Record<string, () => void> = {};

    for (const [event, queryKeys] of Object.entries(EVENT_QUERY_KEYS)) {
      const handler = () => {
        queryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      };
      handlers[event] = handler;
      socket.on(event, handler);
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        socket.off(event, handler);
      }
      disconnectSocket();
    };
  }, [queryClient]);
}
