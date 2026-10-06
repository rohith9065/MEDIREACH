import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as driverService from "../services/driver";

export function useMyAmbulance() {
  return useQuery({ queryKey: ["driver", "ambulance"], queryFn: driverService.getMyAmbulance });
}

export function useUpdateDriverStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: "AVAILABLE" | "OFFLINE") => driverService.updateStatus(status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", "ambulance"] });
    },
  });
}
