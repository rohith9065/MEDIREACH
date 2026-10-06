import { Pool, PoolClient } from "pg";
import { pool } from "../config/db";
import { AmbulanceRequestStatus } from "../../../shared/types/ambulance";

export interface AmbulanceRequestRow {
  id: string;
  patient_id: string;
  ambulance_id: string | null;
  hospital_id: string | null;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_hospital_id: string | null;
  status: AmbulanceRequestStatus;
  cancellation_reason: string | null;
  requested_at: Date;
  accepted_at: Date | null;
  arrived_at: Date | null;
  completed_at: Date | null;
}

export interface AmbulanceRequestDetailRow extends AmbulanceRequestRow {
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  ambulance_latitude: number | null;
  ambulance_longitude: number | null;
}

const NON_TERMINAL = ["REQUESTED", "ACCEPTED", "GOING_TO_PATIENT", "ARRIVED_AT_PATIENT", "GOING_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL"];

const DETAIL_SELECT = `
  SELECT r.*, u.name AS driver_name, u.phone AS driver_phone,
         a.vehicle_number, a.latitude AS ambulance_latitude, a.longitude AS ambulance_longitude
  FROM ambulance_requests r
  LEFT JOIN ambulances a ON a.id = r.ambulance_id
  LEFT JOIN users u ON u.id = a.driver_id
`;

export async function insertRequest(
  patientId: string,
  input: { pickupLatitude: number; pickupLongitude: number; destinationHospitalId?: string },
  ambulanceId: string,
  hospitalId: string,
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRequestRow> {
  const result = await client.query<AmbulanceRequestRow>(
    `INSERT INTO ambulance_requests
       (patient_id, ambulance_id, hospital_id, pickup_latitude, pickup_longitude, destination_hospital_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      patientId,
      ambulanceId,
      hospitalId,
      input.pickupLatitude,
      input.pickupLongitude,
      input.destinationHospitalId ?? null,
    ],
  );
  return result.rows[0];
}

export async function findRequestById(id: string): Promise<AmbulanceRequestRow | null> {
  const result = await pool.query<AmbulanceRequestRow>(`SELECT * FROM ambulance_requests WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function findActiveRequestForPatient(patientId: string): Promise<AmbulanceRequestRow | null> {
  const result = await pool.query<AmbulanceRequestRow>(
    `SELECT * FROM ambulance_requests WHERE patient_id = $1 AND status = ANY($2::ambulance_request_status[]) ORDER BY requested_at DESC LIMIT 1`,
    [patientId, NON_TERMINAL],
  );
  return result.rows[0] ?? null;
}

export async function findActiveRequestForAmbulance(ambulanceId: string): Promise<AmbulanceRequestRow | null> {
  const result = await pool.query<AmbulanceRequestRow>(
    `SELECT * FROM ambulance_requests WHERE ambulance_id = $1 AND status = ANY($2::ambulance_request_status[]) ORDER BY requested_at DESC LIMIT 1`,
    [ambulanceId, NON_TERMINAL],
  );
  return result.rows[0] ?? null;
}

export async function assignAmbulance(
  requestId: string,
  ambulanceId: string,
  hospitalId: string,
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRequestRow | null> {
  const result = await client.query<AmbulanceRequestRow>(
    `UPDATE ambulance_requests SET ambulance_id = $1, hospital_id = $2, status = 'REQUESTED' WHERE id = $3 RETURNING *`,
    [ambulanceId, hospitalId, requestId],
  );
  return result.rows[0] ?? null;
}

export async function updateStatus(
  requestId: string,
  status: AmbulanceRequestStatus,
  extra: { setAcceptedAt?: boolean; setArrivedAt?: boolean; setCompletedAt?: boolean } = {},
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRequestRow | null> {
  const setClauses = ["status = $2"];
  if (extra.setAcceptedAt) setClauses.push("accepted_at = now()");
  if (extra.setArrivedAt) setClauses.push("arrived_at = now()");
  if (extra.setCompletedAt) setClauses.push("completed_at = now()");

  const result = await client.query<AmbulanceRequestRow>(
    `UPDATE ambulance_requests SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
    [requestId, status],
  );
  return result.rows[0] ?? null;
}

export async function cancelRequest(
  requestId: string,
  reason: string,
  client: Pool | PoolClient = pool,
): Promise<AmbulanceRequestRow | null> {
  const result = await client.query<AmbulanceRequestRow>(
    `UPDATE ambulance_requests SET status = 'CANCELLED', cancellation_reason = $1 WHERE id = $2 RETURNING *`,
    [reason, requestId],
  );
  return result.rows[0] ?? null;
}

export async function insertDecline(
  requestId: string,
  ambulanceId: string,
  client: Pool | PoolClient = pool,
): Promise<void> {
  await client.query(
    `INSERT INTO ambulance_request_declines (request_id, ambulance_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [requestId, ambulanceId],
  );
}

export async function listDeclinedAmbulanceIds(requestId: string, client: Pool | PoolClient = pool): Promise<string[]> {
  const result = await client.query<{ ambulance_id: string }>(
    `SELECT ambulance_id FROM ambulance_request_declines WHERE request_id = $1`,
    [requestId],
  );
  return result.rows.map((r) => r.ambulance_id);
}

export async function findRequestDetailForPatient(
  requestId: string,
  patientId: string,
): Promise<AmbulanceRequestDetailRow | null> {
  const result = await pool.query<AmbulanceRequestDetailRow>(
    `${DETAIL_SELECT} WHERE r.id = $1 AND r.patient_id = $2`,
    [requestId, patientId],
  );
  return result.rows[0] ?? null;
}
