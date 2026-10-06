import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as driverService from "../services/driver";
import { getConnectedSocket } from "../services/socket";
import { AmbulanceRequestDetail, AmbulanceRequestStatus } from "../../../../shared/types/ambulance";

const ACTIVE_TRIP_KEY = ["driver", "activeTrip"];

export function useActiveTrip() {
  return useQuery({ queryKey: ACTIVE_TRIP_KEY, queryFn: driverService.getActiveRequest });
}

// Driver's socket joins the request room itself right after accepting (mirrors the patient's
// subscribe:ambulanceRequest call) — the server doesn't force this join, both sides opt in
// symmetrically.
export function useActiveTripUpdates(requestId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!requestId) return;
    const socket = getConnectedSocket();

    const onRequestUpdated = (detail: AmbulanceRequestDetail) => {
      queryClient.setQueryData<{ request: AmbulanceRequestDetail | null }>(ACTIVE_TRIP_KEY, { request: detail });
    };

    socket.emit("subscribe:ambulanceRequest", { requestId });
    socket.on("ambulance:request-updated", onRequestUpdated);

    return () => {
      socket.off("ambulance:request-updated", onRequestUpdated);
      socket.emit("unsubscribe:ambulanceRequest", { requestId });
    };
  }, [requestId, queryClient]);
}

export function useAcceptRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => driverService.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_TRIP_KEY });
      queryClient.invalidateQueries({ queryKey: ["driver", "ambulance"] });
    },
  });
}

export function useDeclineRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => driverService.declineRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_TRIP_KEY });
      queryClient.invalidateQueries({ queryKey: ["driver", "ambulance"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: AmbulanceRequestStatus }) =>
      driverService.updateRequestStatus(requestId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_TRIP_KEY });
      queryClient.invalidateQueries({ queryKey: ["driver", "ambulance"] });
    },
  });
}
