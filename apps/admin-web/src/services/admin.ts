import { apiFetch } from "./apiClient";
import { PendingHospitalListItem, AdminUserListItem, AuditLogEntry } from "../../../../shared/types/admin";
import { HospitalStatus } from "../../../../shared/types/hospital";
import { Role } from "../../../../shared/types/roles";

export function listHospitals(status?: HospitalStatus): Promise<{ hospitals: PendingHospitalListItem[] }> {
  const query = status ? `?status=${status}` : "";
  return apiFetch(`/admin/hospitals${query}`);
}

export function verifyHospital(id: string): Promise<{ hospital: PendingHospitalListItem }> {
  return apiFetch(`/admin/hospitals/${id}/verify`, { method: "PATCH" });
}

export function rejectHospital(id: string, reason?: string): Promise<{ hospital: PendingHospitalListItem }> {
  return apiFetch(`/admin/hospitals/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export function listUsers(filters: { role?: Role; isActive?: boolean }): Promise<{ users: AdminUserListItem[] }> {
  const query = new URLSearchParams({
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.isActive !== undefined ? { isActive: String(filters.isActive) } : {}),
  });
  const qs = query.toString();
  return apiFetch(`/admin/users${qs ? `?${qs}` : ""}`);
}

export function deactivateUser(id: string): Promise<{ user: AdminUserListItem }> {
  return apiFetch(`/admin/users/${id}/deactivate`, { method: "PATCH" });
}

export function listAuditLogs(): Promise<{ logs: AuditLogEntry[] }> {
  return apiFetch("/admin/audit-logs");
}
