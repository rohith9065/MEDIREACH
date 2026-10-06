import { pool } from "../config/db";
import { DoctorStatus } from "../../../shared/types/hospital";

export interface DoctorRow {
  id: string;
  hospital_id: string;
  department_id: string | null;
  department_name: string | null;
  user_id: string | null;
  name: string;
  specialization: string | null;
  experience_years: number | null;
  consultation_fee: string | null;
  status: DoctorStatus;
  profile_image: string | null;
  created_at: Date;
  updated_at: Date;
}

const LIST_SELECT = `
  SELECT d.*, dept.name AS department_name
  FROM doctors d
  LEFT JOIN departments dept ON dept.id = d.department_id
`;

export async function listDoctors(hospitalId: string): Promise<DoctorRow[]> {
  const result = await pool.query<DoctorRow>(`${LIST_SELECT} WHERE d.hospital_id = $1 ORDER BY d.name`, [
    hospitalId,
  ]);
  return result.rows;
}

export async function findDoctorById(hospitalId: string, id: string): Promise<DoctorRow | null> {
  const result = await pool.query<DoctorRow>(`${LIST_SELECT} WHERE d.hospital_id = $1 AND d.id = $2`, [
    hospitalId,
    id,
  ]);
  return result.rows[0] ?? null;
}

export async function createDoctor(
  hospitalId: string,
  input: {
    name: string;
    departmentId?: string;
    specialization?: string;
    experienceYears?: number;
    consultationFee?: number;
  },
): Promise<DoctorRow> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO doctors (hospital_id, department_id, name, specialization, experience_years, consultation_fee)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      hospitalId,
      input.departmentId ?? null,
      input.name,
      input.specialization ?? null,
      input.experienceYears ?? null,
      input.consultationFee ?? null,
    ],
  );
  const created = await findDoctorById(hospitalId, result.rows[0].id);
  if (!created) {
    throw new Error("Failed to load newly created doctor");
  }
  return created;
}

const FIELD_COLUMN_MAP: Record<string, string> = {
  name: "name",
  departmentId: "department_id",
  specialization: "specialization",
  experienceYears: "experience_years",
  consultationFee: "consultation_fee",
};

export async function updateDoctor(
  hospitalId: string,
  id: string,
  fields: Partial<{
    name: string;
    departmentId: string;
    specialization: string;
    experienceYears: number;
    consultationFee: number;
  }>,
): Promise<DoctorRow | null> {
  const columns: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(fields)) {
    const column = FIELD_COLUMN_MAP[key];
    if (column && value !== undefined) {
      columns.push(`${column} = $${i}`);
      values.push(value);
      i++;
    }
  }

  if (columns.length > 0) {
    values.push(hospitalId, id);
    await pool.query(`UPDATE doctors SET ${columns.join(", ")} WHERE hospital_id = $${i} AND id = $${i + 1}`, values);
  }

  return findDoctorById(hospitalId, id);
}

export async function updateDoctorStatus(
  hospitalId: string,
  id: string,
  status: DoctorStatus,
): Promise<DoctorRow | null> {
  await pool.query(`UPDATE doctors SET status = $1 WHERE hospital_id = $2 AND id = $3`, [status, hospitalId, id]);
  return findDoctorById(hospitalId, id);
}
