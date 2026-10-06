import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";
import { EmergencyStatus } from "../../../../shared/types/hospital";

export function useMyHospital() {
  return useQuery({ queryKey: ["hospital", "me"], queryFn: hospitalService.getMyHospital });
}

export function useUpdateEmergencyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emergencyStatus: EmergencyStatus) => hospitalService.updateEmergencyStatus(emergencyStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "me"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", "dashboard"] });
    },
  });
}
