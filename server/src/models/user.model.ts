import { Pool, PoolClient } from "pg";
import { pool } from "../config/db";
import { Role } from "../../../shared/types/roles";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: Role;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

// Optional `client` lets callers participate in an outer transaction (e.g. hospital
// self-registration's create-user + create-hospital + link-staff atomicity) — same pattern
// as appointmentModel.insertAppointment(client, ...).
export async function createUser(
  input: {
    name: string;
    email: string;
    phone?: string;
    passwordHash: string;
    role: Role;
  },
  client: Pool | PoolClient = pool,
): Promise<UserRow> {
  const result = await client.query<UserRow>(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.name, input.email, input.phone ?? null, input.passwordHash, input.role],
  );
  return result.rows[0];
}

export async function listUsers(filters: { role?: Role; isActive?: boolean }): Promise<UserRow[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (filters.role) {
    conditions.push(`role = $${i}`);
    values.push(filters.role);
    i++;
  }
  if (filters.isActive !== undefined) {
    conditions.push(`is_active = $${i}`);
    values.push(filters.isActive);
    i++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query<UserRow>(`SELECT * FROM users ${where} ORDER BY created_at DESC`, values);
  return result.rows;
}

export async function setUserActive(
  id: string,
  isActive: boolean,
  client: Pool | PoolClient = pool,
): Promise<UserRow | null> {
  const result = await client.query<UserRow>(`UPDATE users SET is_active = $1 WHERE id = $2 RETURNING *`, [
    isActive,
    id,
  ]);
  return result.rows[0] ?? null;
}
