import { pool } from "../config/db";
import { FacilityStatus } from "../../../shared/types/hospital";

export interface FacilityRow {
  id: string;
  hospital_id: string;
  facility_name: string;
  status: FacilityStatus;
  quantity: number | null;
  last_updated: Date;
  updated_by: string | null;
}

export async function listFacilities(hospitalId: string): Promise<FacilityRow[]> {
  const result = await pool.query<FacilityRow>(
    `SELECT * FROM facilities WHERE hospital_id = $1 ORDER BY facility_name`,
    [hospitalId],
  );
  return result.rows;
}

export async function upsertFacility(
  hospitalId: string,
  facilityName: string,
  status: FacilityStatus,
  quantity: number | undefined,
  updatedBy: string,
): Promise<FacilityRow> {
  const result = await pool.query<FacilityRow>(
    `INSERT INTO facilities (hospital_id, facility_name, status, quantity, last_updated, updated_by)
     VALUES ($1, $2, $3, $4, now(), $5)
     ON CONFLICT (hospital_id, facility_name)
     DO UPDATE SET status = EXCLUDED.status, quantity = EXCLUDED.quantity,
                    last_updated = now(), updated_by = EXCLUDED.updated_by
     RETURNING *`,
    [hospitalId, facilityName, status, quantity ?? null, updatedBy],
  );
  return result.rows[0];
}
