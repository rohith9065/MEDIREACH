import { pool } from "../config/db";
import { DepartmentStatus } from "../../../shared/types/hospital";

export interface DepartmentRow {
  id: string;
  hospital_id: string;
  name: string;
  description: string | null;
  status: DepartmentStatus;
  created_at: Date;
  updated_at: Date;
}

export async function listDepartments(hospitalId: string): Promise<DepartmentRow[]> {
  const result = await pool.query<DepartmentRow>(`SELECT * FROM departments WHERE hospital_id = $1 ORDER BY name`, [
    hospitalId,
  ]);
  return result.rows;
}

export async function findDepartmentById(hospitalId: string, id: string): Promise<DepartmentRow | null> {
  const result = await pool.query<DepartmentRow>(
    `SELECT * FROM departments WHERE hospital_id = $1 AND id = $2`,
    [hospitalId, id],
  );
  return result.rows[0] ?? null;
}

export async function createDepartment(
  hospitalId: string,
  name: string,
  description?: string,
): Promise<DepartmentRow> {
  const result = await pool.query<DepartmentRow>(
    `INSERT INTO departments (hospital_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [hospitalId, name, description ?? null],
  );
  return result.rows[0];
}

export async function updateDepartment(
  hospitalId: string,
  id: string,
  fields: Partial<{ name: string; description: string; status: DepartmentStatus }>,
): Promise<DepartmentRow | null> {
  const columns: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      columns.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
  }

  if (columns.length === 0) {
    return findDepartmentById(hospitalId, id);
  }

  values.push(hospitalId, id);
  const result = await pool.query<DepartmentRow>(
    `UPDATE departments SET ${columns.join(", ")} WHERE hospital_id = $${i} AND id = $${i + 1} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}
