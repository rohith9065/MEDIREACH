import { AUDIT_ACTIONS } from "../constants/admin";
import { HospitalStatus } from "./hospital";
import { Role } from "./roles";

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// Super-admin view of a hospital — the public Hospital type plus who registered it, so the
// verification queue can show an admin contact without a separate lookup.
export interface PendingHospitalListItem {
  id: string;
  name: string;
  registrationNumber: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  status: HospitalStatus;
  adminName: string | null;
  adminEmail: string | null;
  createdAt: string;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
