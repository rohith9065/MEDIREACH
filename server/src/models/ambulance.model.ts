import { Pool, PoolClient } from "pg";
import { pool } from "../config/db";
import { AmbulanceStatus } from "../../../shared/types/ambulance";

export interface AmbulanceRow {
  id: string;
  hospital_id: string;
  driver_id: string;
  vehicle_number: string;
  status: AmbulanceStatus;
  latitude: number | null;
  longitude: number | null;
  last_location_update: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AmbulanceWithDriverRow extends AmbulanceRow {
  driver_name: string;
  driver_phone: string | null;
}

const LIST_SELECT = `
  SELECT a.*, u.name AS driver_name, u.phone AS driver_phone
  FROM ambulances a
  JOIN users u ON u.id = a.driver_id
`;

export async function createAmbulance(
  hospitalId: string,
  driverId: string,
  input: { vehicleNumber: string; latitude?: number; longitude?: number },
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRow> {
  const result = await client.query<AmbulanceRow>(
    `INSERT INTO ambulances (hospital_id, driver_id, vehicle_number, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [hospitalId, driverId, input.vehicleNumber, input.latitude ?? null, input.longitude ?? null],
  );
  return result.rows[0];
}

export async function findAmbulanceByDriverId(driverId: string): Promise<AmbulanceRow | null> {
  const result = await pool.query<AmbulanceRow>(`SELECT * FROM ambulances WHERE driver_id = $1`, [driverId]);
  return result.rows[0] ?? null;
}

export async function findAmbulanceById(id: string): Promise<AmbulanceRow | null> {
  const result = await pool.query<AmbulanceRow>(`SELECT * FROM ambulances WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function listAmbulancesForHospital(hospitalId: string): Promise<AmbulanceWithDriverRow[]> {
  const result = await pool.query<AmbulanceWithDriverRow>(
    `${LIST_SELECT} WHERE a.hospital_id = $1 ORDER BY a.created_at DESC`,
    [hospitalId],
  );
  return result.rows;
}

// Locked so two simultaneous requests can't both dispatch the same ambulance — the caller
// must run this inside a transaction and flip the row's status before releasing the lock.
export async function findNearestAvailableAmbulance(
  lat: number,
  lng: number,
  excludeIds: string[],
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRow | null> {
  const result = await client.query<AmbulanceRow>(
    `SELECT * FROM (
       SELECT *, (
         6371 * acos(
           LEAST(1, GREATEST(-1,
             cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2))
             + sin(radians($1)) * sin(radians(latitude))
           ))
         )
       ) AS distance_km
       FROM ambulances
       WHERE status = 'AVAILABLE'
         AND latitude IS NOT NULL AND longitude IS NOT NULL
         AND NOT (id = ANY($3::uuid[]))
     ) nearby
     ORDER BY distance_km ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`,
    [lat, lng, excludeIds],
  );
  return result.rows[0] ?? null;
}

export async function setAmbulanceStatus(
  id: string,
  status: AmbulanceStatus,
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRow | null> {
  const result = await client.query<AmbulanceRow>(`UPDATE ambulances SET status = $1 WHERE id = $2 RETURNING *`, [
    status,
    id,
  ]);
  return result.rows[0] ?? null;
}

// Always-on — kept fresh whenever a driver is on shift so nearest-available lookups stay
// accurate. Trip-only location *history* is a separate insert (insertAmbulanceLocationHistory).
export async function updateAmbulanceCurrentPosition(
  id: string,
  lat: number,
  lng: number,
): Promise<AmbulanceRow | null> {
  const result = await pool.query<AmbulanceRow>(
    `UPDATE ambulances SET latitude = $1, longitude = $2, last_location_update = now() WHERE id = $3 RETURNING *`,
    [lat, lng, id],
  );
  return result.rows[0] ?? null;
}

export async function insertAmbulanceLocationHistory(ambulanceId: string, lat: number, lng: number): Promise<void> {
  await pool.query(`INSERT INTO ambulance_locations (ambulance_id, latitude, longitude) VALUES ($1, $2, $3)`, [
    ambulanceId,
    lat,
    lng,
  ]);
}
