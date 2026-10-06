import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";
import { AmbulanceRequestDetail } from "../../../../shared/types/ambulance";

// Writes straight into the query cache instead of invalidating — a refetch per location tick
// would be wasteful and would make the map marker jump instead of glide.
export function useAmbulanceRequestUpdates(requestId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!requestId) return;
    const socket = getSocket();

    const setDetail = (updater: (prev: AmbulanceRequestDetail | undefined) => AmbulanceRequestDetail | undefined) => {
      queryClient.setQueryData<{ request: AmbulanceRequestDetail | null }>(["ambulance", "detail", requestId], (prev) =>
        prev ? { request: updater(prev.request ?? undefined) ?? prev.request } : prev,
      );
      queryClient.setQueryData<{ request: AmbulanceRequestDetail | null }>(["ambulance", "active"], (prev) =>
        prev?.request?.id === requestId ? { request: updater(prev.request ?? undefined) ?? prev.request } : prev,
      );
    };

    const onRequestUpdated = (detail: AmbulanceRequestDetail) => setDetail(() => detail);
    const onLocationUpdated = (payload: { latitude: number; longitude: number }) =>
      setDetail((prev) => (prev ? { ...prev, ambulanceLatitude: payload.latitude, ambulanceLongitude: payload.longitude } : prev));

    socket.emit("subscribe:ambulanceRequest", { requestId });
    socket.on("ambulance:request-updated", onRequestUpdated);
    socket.on("ambulance:location-updated", onLocationUpdated);

    return () => {
      socket.off("ambulance:request-updated", onRequestUpdated);
      socket.off("ambulance:location-updated", onLocationUpdated);
      socket.emit("unsubscribe:ambulanceRequest", { requestId });
    };
  }, [requestId, queryClient]);
}
