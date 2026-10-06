import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ambulanceService from "../services/ambulance";

export function useActiveAmbulanceRequest() {
  return useQuery({
    queryKey: ["ambulance", "active"],
    queryFn: ambulanceService.getActiveAmbulanceRequest,
  });
}

export function useAmbulanceRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["ambulance", "detail", id],
    queryFn: () => ambulanceService.getAmbulanceRequestDetail(id as string),
    enabled: !!id,
  });
}

export function useCancelAmbulanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ambulanceService.cancelAmbulanceRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambulance"] });
    },
  });
}
