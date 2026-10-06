import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";

const LIVE_EVENTS = [
  "hospital:bed-updated",
  "hospital:doctor-updated",
  "hospital:facility-updated",
  "hospital:emergency-updated",
];

// Subscribes to live updates for exactly the hospital currently open on Hospital Details —
// not every hospital in the nearby list, which would mean an unbounded number of rooms for
// little payoff. See the Phase 5 plan note for why this is scoped this way.
export function useHospitalLiveUpdates(hospitalId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hospitalId) return;

    const socket = getSocket();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["hospitals", "detail", hospitalId] });

    socket.emit("subscribe:hospital", { hospitalId });
    LIVE_EVENTS.forEach((event) => socket.on(event, invalidate));

    return () => {
      LIVE_EVENTS.forEach((event) => socket.off(event, invalidate));
      socket.emit("unsubscribe:hospital", { hospitalId });
    };
  }, [hospitalId, queryClient]);
}
