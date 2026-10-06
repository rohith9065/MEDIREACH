import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminService from "../services/admin";
import { Role } from "../../../../shared/types/roles";

export function useUsers(filters: { role?: Role; isActive?: boolean }) {
  return useQuery({
    queryKey: ["admin", "users", filters.role ?? "ALL", filters.isActive ?? "ALL"],
    queryFn: () => adminService.listUsers(filters),
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
  });
}
