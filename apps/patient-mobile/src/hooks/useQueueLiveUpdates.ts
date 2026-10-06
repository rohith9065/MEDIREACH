import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";

// "My Appointments" can span several hospitals at once, so this subscribes to every
// hospital room the patient currently has an appointment at and invalidates the whole
// list on any queue:updated event, same subscribe/invalidate shape as useHospitalLiveUpdates.
export function useQueueLiveUpdates(hospitalIds: string[]): void {
  const queryClient = useQueryClient();
  const key = [...new Set(hospitalIds)].sort().join(",");

  useEffect(() => {
    if (!key) return;
    const ids = key.split(",");
    const socket = getSocket();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["appointments", "my"] });

    ids.forEach((id) => socket.emit("subscribe:hospital", { hospitalId: id }));
    socket.on("queue:updated", invalidate);

    return () => {
      socket.off("queue:updated", invalidate);
      ids.forEach((id) => socket.emit("unsubscribe:hospital", { hospitalId: id }));
    };
  }, [key, queryClient]);
}
