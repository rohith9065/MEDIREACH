import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ambulanceService from "../services/ambulance";

export function useRequestAmbulance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ambulanceService.requestAmbulance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ambulance", "active"] });
    },
  });
}
