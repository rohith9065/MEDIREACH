import { pool } from "../config/db";
import { BedType } from "../../../shared/types/hospital";
import { AppError } from "../utils/AppError";

export interface BedRow {
  id: string;
  hospital_id: string;
  bed_type: BedType;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  last_updated: Date;
  updated_by: string | null;
}

export async function listBeds(hospitalId: string): Promise<BedRow[]> {
  const result = await pool.query<BedRow>(`SELECT * FROM beds WHERE hospital_id = $1 ORDER BY bed_type`, [
    hospitalId,
  ]);
  return result.rows;
}

export async function upsertBed(
  hospitalId: string,
  bedType: BedType,
  totalBeds: number,
  occupiedBeds: number,
  updatedBy: string,
): Promise<BedRow> {
  if (occupiedBeds > totalBeds) {
    throw new AppError(400, "occupiedBeds cannot exceed totalBeds");
  }

  const result = await pool.query<BedRow>(
    `INSERT INTO beds (hospital_id, bed_type, total_beds, occupied_beds, last_updated, updated_by)
     VALUES ($1, $2, $3, $4, now(), $5)
     ON CONFLICT (hospital_id, bed_type)
     DO UPDATE SET total_beds = EXCLUDED.total_beds, occupied_beds = EXCLUDED.occupied_beds,
                    last_updated = now(), updated_by = EXCLUDED.updated_by
     RETURNING *`,
    [hospitalId, bedType, totalBeds, occupiedBeds, updatedBy],
  );
  return result.rows[0];
}
