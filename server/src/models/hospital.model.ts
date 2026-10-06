import { Pool, PoolClient } from "pg";
import { pool } from "../config/db";
import { EmergencyStatus, HospitalStatus } from "../../../shared/types/hospital";

export interface HospitalRow {
  id: string;
  name: string;
  registration_number: string;
  description: string | null;
  phone: string | null;
  emergency_phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: string | null;
  verified: boolean;
  status: HospitalStatus;
  emergency_status: EmergencyStatus;
  emergency_status_updated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export async function findHospitalById(id: string): Promise<HospitalRow | null> {
  const result = await pool.query<HospitalRow>(`SELECT * FROM hospitals WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

// Shared by attachHospitalContext (HTTP) and the Socket.IO connection handler — one
// hospital admin maps to exactly one hospital via hospital_staff (see Phase 2 plan note).
export async function findHospitalIdForUser(userId: string): Promise<string | null> {
  const result = await pool.query<{ hospital_id: string }>(
    `SELECT hospital_id FROM hospital_staff WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]?.hospital_id ?? null;
}

export async function findHospitalByRegistrationNumber(registrationNumber: string): Promise<HospitalRow | null> {
  const result = await pool.query<HospitalRow>(`SELECT * FROM hospitals WHERE registration_number = $1`, [
    registrationNumber,
  ]);
  return result.rows[0] ?? null;
}

// Phase 9 — hospital self-registration. Always created PENDING/unverified; a super admin
// verifies it later (see admin.service.ts). Accepts a transaction client so it can run
// alongside createUser + linkHospitalStaff atomically.
export async function createHospital(
  input: {
    name: string;
    registrationNumber: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  },
  client: Pool | PoolClient = pool,
): Promise<HospitalRow> {
  const result = await client.query<HospitalRow>(
    `INSERT INTO hospitals (name, registration_number, phone, address, latitude, longitude, verified, status)
     VALUES ($1, $2, $3, $4, $5, $6, false, 'PENDING')
     RETURNING *`,
    [
      input.name,
      input.registrationNumber,
      input.phone ?? null,
      input.address ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
    ],
  );
  return result.rows[0];
}

export async function linkHospitalStaff(
  hospitalId: string,
  userId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO hospital_staff (hospital_id, user_id, role) VALUES ($1, $2, 'HOSPITAL_ADMIN')`,
    [hospitalId, userId],
  );
}

export interface HospitalWithAdminRow extends HospitalRow {
  admin_name: string | null;
  admin_email: string | null;
}

// Super-admin verification queue — left join so a hospital with no linked admin (shouldn't
// happen via self-registration, but seed data doesn't always link one) still shows up.
export async function listHospitalsForAdmin(status?: HospitalStatus): Promise<HospitalWithAdminRow[]> {
  const where = status ? `WHERE h.status = $1` : "";
  const values = status ? [status] : [];
  const result = await pool.query<HospitalWithAdminRow>(
    `SELECT h.*, u.name AS admin_name, u.email AS admin_email
     FROM hospitals h
     LEFT JOIN hospital_staff hs ON hs.hospital_id = h.id
     LEFT JOIN users u ON u.id = hs.user_id
     ${where}
     ORDER BY h.created_at DESC`,
    values,
  );
  return result.rows;
}

export async function updateHospitalVerification(
  id: string,
  fields: { verified: boolean; status: HospitalStatus },
  client: Pool | PoolClient = pool,
): Promise<HospitalRow | null> {
  const result = await client.query<HospitalRow>(
    `UPDATE hospitals SET verified = $1, status = $2 WHERE id = $3 RETURNING *`,
    [fields.verified, fields.status, id],
  );
  return result.rows[0] ?? null;
}

const PROFILE_FIELD_COLUMN_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  phone: "phone",
  emergencyPhone: "emergency_phone",
  email: "email",
  address: "address",
};

export async function updateHospitalProfile(
  id: string,
  fields: Partial<{
    name: string;
    description: string;
    phone: string;
    emergencyPhone: string;
    email: string;
    address: string;
  }>,
): Promise<HospitalRow | null> {
  const columns: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(fields)) {
    const column = PROFILE_FIELD_COLUMN_MAP[key];
    if (column && value !== undefined) {
      columns.push(`${column} = $${i}`);
      values.push(value);
      i++;
    }
  }

  if (columns.length === 0) {
    return findHospitalById(id);
  }

  values.push(id);
  const result = await pool.query<HospitalRow>(
    `UPDATE hospitals SET ${columns.join(", ")} WHERE id = $${i} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function updateEmergencyStatus(id: string, status: EmergencyStatus): Promise<HospitalRow | null> {
  const result = await pool.query<HospitalRow>(
    `UPDATE hospitals SET emergency_status = $1, emergency_status_updated_at = now() WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return result.rows[0] ?? null;
}
