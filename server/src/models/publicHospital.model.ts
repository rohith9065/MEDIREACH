import { pool } from "../config/db";
import { HospitalRow } from "./hospital.model";

export interface NearbyHospitalRow extends HospitalRow {
  distance_km: number;
}

export async function findNearbyHospitals(
  lat: number,
  lng: number,
  radiusKm: number,
  q?: string,
  excludeUnavailable = false,
): Promise<NearbyHospitalRow[]> {
  const result = await pool.query<NearbyHospitalRow>(
    `WITH nearby AS (
       SELECT *, (
         6371 * acos(
           LEAST(1, GREATEST(-1,
             cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2))
             + sin(radians($1)) * sin(radians(latitude))
           ))
         )
       ) AS distance_km
       FROM hospitals
       WHERE verified = true AND status = 'VERIFIED'
         AND latitude IS NOT NULL AND longitude IS NOT NULL
         AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%')
         AND ($5::boolean IS NOT TRUE OR emergency_status <> 'UNAVAILABLE')
     )
     SELECT * FROM nearby WHERE distance_km <= $4 ORDER BY distance_km ASC`,
    [lat, lng, q ?? null, radiusKm, excludeUnavailable],
  );
  return result.rows;
}

export async function findVerifiedHospitalById(id: string): Promise<HospitalRow | null> {
  const result = await pool.query<HospitalRow>(
    `SELECT * FROM hospitals WHERE id = $1 AND verified = true AND status = 'VERIFIED'`,
    [id],
  );
  return result.rows[0] ?? null;
}
