import { pool } from "../config/db";

export interface DoctorScheduleRow {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string; // TIME comes back from pg as "HH:MM:SS"
  end_time: string;
}

export async function listSchedule(doctorId: string): Promise<DoctorScheduleRow[]> {
  const result = await pool.query<DoctorScheduleRow>(
    `SELECT * FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week`,
    [doctorId],
  );
  return result.rows;
}

export async function replaceSchedule(
  doctorId: string,
  windows: { dayOfWeek: number; startTime: string; endTime: string }[],
): Promise<DoctorScheduleRow[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM doctor_schedules WHERE doctor_id = $1`, [doctorId]);
    for (const w of windows) {
      await client.query(
        `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)`,
        [doctorId, w.dayOfWeek, w.startTime, w.endTime],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return listSchedule(doctorId);
}

export async function findWindowForDay(doctorId: string, dayOfWeek: number): Promise<DoctorScheduleRow | null> {
  const result = await pool.query<DoctorScheduleRow>(
    `SELECT * FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2`,
    [doctorId, dayOfWeek],
  );
  return result.rows[0] ?? null;
}
