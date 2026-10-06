import { PoolClient } from "pg";
import { pool } from "../config/db";
import { AppointmentStatus } from "../../../shared/types/appointment";

export interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  token_number: number;
  created_at: Date;
  updated_at: Date;
}

export async function listBookedTimesForDoctorDate(doctorId: string, date: string): Promise<string[]> {
  const result = await pool.query<{ appointment_time: string }>(
    `SELECT appointment_time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'CANCELLED'`,
    [doctorId, date],
  );
  return result.rows.map((r) => r.appointment_time);
}

export async function findAppointmentById(id: string): Promise<AppointmentRow | null> {
  const result = await pool.query<AppointmentRow>(`SELECT * FROM appointments WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function insertAppointment(
  client: PoolClient,
  input: {
    patientId: string;
    doctorId: string;
    hospitalId: string;
    appointmentDate: string;
    appointmentTime: string;
    tokenNumber: number;
  },
): Promise<AppointmentRow> {
  const result = await client.query<AppointmentRow>(
    `INSERT INTO appointments (patient_id, doctor_id, hospital_id, appointment_date, appointment_time, token_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      input.patientId,
      input.doctorId,
      input.hospitalId,
      input.appointmentDate,
      input.appointmentTime,
      input.tokenNumber,
    ],
  );
  return result.rows[0];
}

// Advisory lock scoped to this doctor+date so two concurrent bookings can't both read the
// same MAX(token_number) and collide — must run inside the same transaction as the insert.
export async function nextTokenNumber(client: PoolClient, doctorId: string, date: string): Promise<number> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`${doctorId}:${date}`]);
  const result = await client.query<{ next: string }>(
    `SELECT COALESCE(MAX(token_number), 0) + 1 AS next FROM appointments WHERE doctor_id = $1 AND appointment_date = $2`,
    [doctorId, date],
  );
  return Number(result.rows[0].next);
}

export async function cancelAppointmentIfOwned(id: string, patientId: string): Promise<AppointmentRow | null> {
  const result = await pool.query<AppointmentRow>(
    `UPDATE appointments SET status = 'CANCELLED'
     WHERE id = $1 AND patient_id = $2 AND status = 'BOOKED'
     RETURNING *`,
    [id, patientId],
  );
  return result.rows[0] ?? null;
}

// "My appointments" — joined with doctor/hospital names and a live queue snapshot (current
// serving token + how many WAITING tokens are still ahead of this one).
export interface AppointmentWithQueueRow extends AppointmentRow {
  doctor_name: string;
  specialization: string | null;
  hospital_name: string;
  queue_status: string | null;
  current_serving_token: number | null;
  patients_ahead: string | null;
}

export async function listAppointmentsForPatient(patientId: string): Promise<AppointmentWithQueueRow[]> {
  const result = await pool.query<AppointmentWithQueueRow>(
    `SELECT
       a.*,
       d.name AS doctor_name,
       d.specialization,
       h.name AS hospital_name,
       qt.status AS queue_status,
       (
         SELECT MIN(qt3.token_number)
         FROM queue_tokens qt3
         JOIN appointments a3 ON a3.id = qt3.appointment_id
         WHERE a3.doctor_id = a.doctor_id AND a3.appointment_date = a.appointment_date
           AND qt3.status IN ('CALLED', 'IN_CONSULTATION')
       ) AS current_serving_token,
       (
         SELECT COUNT(*)
         FROM queue_tokens qt2
         JOIN appointments a2 ON a2.id = qt2.appointment_id
         WHERE a2.doctor_id = a.doctor_id AND a2.appointment_date = a.appointment_date
           AND qt2.status = 'WAITING' AND qt2.token_number < a.token_number
       ) AS patients_ahead
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN hospitals h ON h.id = a.hospital_id
     LEFT JOIN queue_tokens qt ON qt.appointment_id = a.id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [patientId],
  );
  return result.rows;
}
