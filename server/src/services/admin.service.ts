import { pool } from "../config/db";
import * as hospitalModel from "../models/hospital.model";
import * as userModel from "../models/user.model";
import * as auditLogModel from "../models/auditLog.model";
import { PendingHospitalListItem, AdminUserListItem, AuditLogEntry } from "../../../shared/types/admin";
import { HospitalStatus } from "../../../shared/types/hospital";
import { Role } from "../../../shared/types/roles";
import { ROLES } from "../../../shared/constants/roles";
import { AppError } from "../utils/AppError";

function toHospitalListItem(row: hospitalModel.HospitalWithAdminRow): PendingHospitalListItem {
  return {
    id: row.id,
    name: row.name,
    registrationNumber: row.registration_number,
    phone: row.phone,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    verified: row.verified,
    status: row.status,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    createdAt: row.created_at.toISOString(),
  };
}

function toUserListItem(row: userModel.UserRow): AdminUserListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

function toAuditLogEntry(row: auditLogModel.AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listHospitals(status?: HospitalStatus): Promise<PendingHospitalListItem[]> {
  const rows = await hospitalModel.listHospitalsForAdmin(status);
  return rows.map(toHospitalListItem);
}

export async function verifyHospital(hospitalId: string, actorUserId: string): Promise<PendingHospitalListItem> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hospital = await hospitalModel.updateHospitalVerification(
      hospitalId,
      { verified: true, status: "VERIFIED" },
      client,
    );
    if (!hospital) {
      throw new AppError(404, "Hospital not found");
    }
    await auditLogModel.insertAuditLog(
      { actorUserId, action: "HOSPITAL_VERIFIED", targetType: "hospital", targetId: hospitalId },
      client,
    );
    await client.query("COMMIT");
    return toHospitalListItem({ ...hospital, admin_name: null, admin_email: null });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectHospital(
  hospitalId: string,
  actorUserId: string,
  reason?: string,
): Promise<PendingHospitalListItem> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hospital = await hospitalModel.updateHospitalVerification(
      hospitalId,
      { verified: false, status: "REJECTED" },
      client,
    );
    if (!hospital) {
      throw new AppError(404, "Hospital not found");
    }
    await auditLogModel.insertAuditLog(
      {
        actorUserId,
        action: "HOSPITAL_REJECTED",
        targetType: "hospital",
        targetId: hospitalId,
        metadata: reason ? { reason } : null,
      },
      client,
    );
    await client.query("COMMIT");
    return toHospitalListItem({ ...hospital, admin_name: null, admin_email: null });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listUsers(filters: { role?: Role; isActive?: boolean }): Promise<AdminUserListItem[]> {
  const rows = await userModel.listUsers(filters);
  return rows.map(toUserListItem);
}

export async function deactivateUser(userId: string, actorUserId: string): Promise<AdminUserListItem> {
  if (userId === actorUserId) {
    throw new AppError(400, "You can't deactivate your own account");
  }

  const target = await userModel.findUserById(userId);
  if (!target) {
    throw new AppError(404, "User not found");
  }
  if (target.role === ROLES.SUPER_ADMIN) {
    throw new AppError(400, "Super admin accounts can't be deactivated");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await userModel.setUserActive(userId, false, client);
    if (!updated) {
      throw new AppError(404, "User not found");
    }
    await auditLogModel.insertAuditLog(
      { actorUserId, action: "USER_DEACTIVATED", targetType: "user", targetId: userId },
      client,
    );
    await client.query("COMMIT");
    return toUserListItem(updated);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listAuditLogs(limit = 50, offset = 0): Promise<AuditLogEntry[]> {
  const rows = await auditLogModel.listAuditLogs(limit, offset);
  return rows.map(toAuditLogEntry);
}
