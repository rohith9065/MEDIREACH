import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminService from "../services/admin";
import { HospitalStatus } from "../../../../shared/types/hospital";

export function useHospitals(status?: HospitalStatus) {
  return useQuery({
    queryKey: ["admin", "hospitals", status ?? "ALL"],
    queryFn: () => adminService.listHospitals(status),
  });
}

export function useVerifyHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.verifyHospital(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
  });
}

export function useRejectHospital() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminService.rejectHospital(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "hospitals"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
  });
}
