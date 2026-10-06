import { PoolClient } from "pg";
import { pool } from "../config/db";
import { QueueStatus } from "../../../shared/types/appointment";

export interface QueueTokenRow {
  id: string;
  appointment_id: string;
  hospital_id: string;
  doctor_id: string;
  patient_id: string;
  token_number: number;
  status: QueueStatus;
  created_at: Date;
  called_at: Date | null;
  completed_at: Date | null;
}

export async function insertQueueToken(
  client: PoolClient,
  input: { appointmentId: string; hospitalId: string; doctorId: string; patientId: string; tokenNumber: number },
): Promise<QueueTokenRow> {
  const result = await client.query<QueueTokenRow>(
    `INSERT INTO queue_tokens (appointment_id, hospital_id, doctor_id, patient_id, token_number)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.appointmentId, input.hospitalId, input.doctorId, input.patientId, input.tokenNumber],
  );
  return result.rows[0];
}

export interface QueueTokenWithPatientRow extends QueueTokenRow {
  patient_name: string;
}

export async function listQueueForDoctorDate(
  hospitalId: string,
  doctorId: string,
  date: string,
): Promise<QueueTokenWithPatientRow[]> {
  const result = await pool.query<QueueTokenWithPatientRow>(
    `SELECT qt.*, u.name AS patient_name
     FROM queue_tokens qt
     JOIN appointments a ON a.id = qt.appointment_id
     JOIN users u ON u.id = qt.patient_id
     WHERE qt.hospital_id = $1 AND qt.doctor_id = $2 AND a.appointment_date = $3
     ORDER BY qt.token_number ASC`,
    [hospitalId, doctorId, date],
  );
  return result.rows;
}

export async function findQueueTokenById(hospitalId: string, tokenId: string): Promise<QueueTokenWithPatientRow | null> {
  const result = await pool.query<QueueTokenWithPatientRow>(
    `SELECT qt.*, u.name AS patient_name
     FROM queue_tokens qt
     JOIN users u ON u.id = qt.patient_id
     WHERE qt.id = $1 AND qt.hospital_id = $2`,
    [tokenId, hospitalId],
  );
  return result.rows[0] ?? null;
}

export async function updateQueueTokenStatus(
  hospitalId: string,
  tokenId: string,
  status: QueueStatus,
  extra: { setCalledAt?: boolean; setCompletedAt?: boolean } = {},
): Promise<QueueTokenWithPatientRow | null> {
  const setClauses = ["status = $3"];
  if (extra.setCalledAt) setClauses.push("called_at = now()");
  if (extra.setCompletedAt) setClauses.push("completed_at = now()");

  await pool.query(`UPDATE queue_tokens SET ${setClauses.join(", ")} WHERE id = $1 AND hospital_id = $2`, [
    tokenId,
    hospitalId,
    status,
  ]);
  return findQueueTokenById(hospitalId, tokenId);
}

export async function cancelQueueTokenForAppointment(client: PoolClient, appointmentId: string): Promise<void> {
  await client.query(`UPDATE queue_tokens SET status = 'CANCELLED' WHERE appointment_id = $1`, [appointmentId]);
}
