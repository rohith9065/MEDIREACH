import { useQuery } from "@tanstack/react-query";
import * as adminService from "../services/admin";

export function useAuditLog() {
  return useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminService.listAuditLogs(),
  });
}
