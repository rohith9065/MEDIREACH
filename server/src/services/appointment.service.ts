import { pool } from "../config/db";
import { AppError } from "../utils/AppError";
import { getIO, hospitalRoom } from "../sockets";
import * as scheduleModel from "../models/schedule.model";
import * as appointmentModel from "../models/appointment.model";
import * as queueModel from "../models/queue.model";
import * as doctorModel from "../models/doctor.model";
import * as hospitalModel from "../models/hospital.model";
import { DoctorScheduleWindow, AvailableSlot, Appointment, QueueToken, QueueStatus } from "../../../shared/types/appointment";
import { SLOT_INTERVAL_MINUTES } from "../../../shared/constants/appointment";
import { SetDoctorScheduleInput, BookAppointmentInput } from "../../../shared/validation/appointment.schema";

function emitQueueUpdated(hospitalId: string, payload: unknown): void {
  getIO()?.to(hospitalRoom(hospitalId)).emit("queue:updated", payload);
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// pg TIME columns come back as "HH:MM:SS" — normalize to "HH:MM" for the API.
function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

function toAppointmentDTO(row: appointmentModel.AppointmentWithQueueRow): Appointment {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    specialization: row.specialization,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    appointmentDate: row.appointment_date,
    appointmentTime: normalizeTime(row.appointment_time),
    status: row.status,
    tokenNumber: row.token_number,
    queueStatus: (row.queue_status as QueueStatus | null) ?? null,
    currentServingToken: row.current_serving_token,
    patientsAhead: row.patients_ahead !== null ? Number(row.patients_ahead) : null,
    createdAt: row.created_at.toISOString(),
  };
}

function toQueueTokenDTO(row: queueModel.QueueTokenWithPatientRow): QueueToken {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    hospitalId: row.hospital_id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    tokenNumber: row.token_number,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    calledAt: row.called_at ? row.called_at.toISOString() : null,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

async function assertDoctorBelongsToHospital(hospitalId: string, doctorId: string): Promise<void> {
  const doctor = await doctorModel.findDoctorById(hospitalId, doctorId);
  if (!doctor) {
    throw new AppError(404, "Doctor not found at this hospital");
  }
}

export async function getDoctorSchedule(hospitalId: string, doctorId: string): Promise<DoctorScheduleWindow[]> {
  await assertDoctorBelongsToHospital(hospitalId, doctorId);
  const rows = await scheduleModel.listSchedule(doctorId);
  return rows.map((r) => ({
    dayOfWeek: r.day_of_week,
    startTime: normalizeTime(r.start_time),
    endTime: normalizeTime(r.end_time),
  }));
}

export async function setDoctorSchedule(
  hospitalId: string,
  doctorId: string,
  input: SetDoctorScheduleInput,
): Promise<DoctorScheduleWindow[]> {
  await assertDoctorBelongsToHospital(hospitalId, doctorId);
  const rows = await scheduleModel.replaceSchedule(doctorId, input.windows);
  return rows.map((r) => ({
    dayOfWeek: r.day_of_week,
    startTime: normalizeTime(r.start_time),
    endTime: normalizeTime(r.end_time),
  }));
}

export async function getAvailableSlots(doctorId: string, date: string): Promise<AvailableSlot[]> {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const window = await scheduleModel.findWindowForDay(doctorId, dayOfWeek);
  if (!window) {
    return [];
  }

  const bookedTimes = new Set(
    (await appointmentModel.listBookedTimesForDoctorDate(doctorId, date)).map(normalizeTime),
  );

  const startMin = timeToMinutes(normalizeTime(window.start_time));
  const endMin = timeToMinutes(normalizeTime(window.end_time));

  const slots: AvailableSlot[] = [];
  for (let m = startMin; m + SLOT_INTERVAL_MINUTES <= endMin; m += SLOT_INTERVAL_MINUTES) {
    const time = minutesToTime(m);
    if (!bookedTimes.has(time)) {
      slots.push({ time });
    }
  }
  return slots;
}

export async function bookAppointment(patientId: string, input: BookAppointmentInput): Promise<Appointment> {
  const hospital = await hospitalModel.findHospitalById(input.hospitalId);
  if (!hospital) {
    throw new AppError(404, "Hospital not found");
  }
  const doctor = await doctorModel.findDoctorById(input.hospitalId, input.doctorId);
  if (!doctor) {
    throw new AppError(404, "Doctor not found at this hospital");
  }

  const slots = await getAvailableSlots(input.doctorId, input.appointmentDate);
  if (!slots.some((s) => s.time === input.appointmentTime)) {
    throw new AppError(400, "That slot is not available");
  }

  const client = await pool.connect();
  let appointmentId: string;
  try {
    await client.query("BEGIN");
    const tokenNumber = await appointmentModel.nextTokenNumber(client, input.doctorId, input.appointmentDate);

    let appointmentRow;
    try {
      appointmentRow = await appointmentModel.insertAppointment(client, {
        patientId,
        doctorId: input.doctorId,
        hospitalId: input.hospitalId,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
        tokenNumber,
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(409, "That slot was just booked by someone else — pick another.");
      }
      throw err;
    }

    await queueModel.insertQueueToken(client, {
      appointmentId: appointmentRow.id,
      hospitalId: input.hospitalId,
      doctorId: input.doctorId,
      patientId,
      tokenNumber,
    });

    await client.query("COMMIT");
    appointmentId = appointmentRow.id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  emitQueueUpdated(input.hospitalId, { doctorId: input.doctorId, appointmentDate: input.appointmentDate });

  const rows = await appointmentModel.listAppointmentsForPatient(patientId);
  const created = rows.find((a) => a.id === appointmentId);
  if (!created) {
    throw new AppError(500, "Failed to load the newly created appointment");
  }
  return toAppointmentDTO(created);
}

export async function listMyAppointments(patientId: string): Promise<Appointment[]> {
  const rows = await appointmentModel.listAppointmentsForPatient(patientId);
  return rows.map(toAppointmentDTO);
}

export async function cancelAppointment(patientId: string, appointmentId: string): Promise<void> {
  const client = await pool.connect();
  let cancelled: { doctor_id: string; hospital_id: string; appointment_date: string } | undefined;
  try {
    await client.query("BEGIN");
    const result = await client.query<{ doctor_id: string; hospital_id: string; appointment_date: string }>(
      `UPDATE appointments SET status = 'CANCELLED' WHERE id = $1 AND patient_id = $2 AND status = 'BOOKED'
       RETURNING doctor_id, hospital_id, appointment_date`,
      [appointmentId, patientId],
    );
    if (!result.rows[0]) {
      throw new AppError(404, "Appointment not found or already cancelled");
    }
    await queueModel.cancelQueueTokenForAppointment(client, appointmentId);
    await client.query("COMMIT");
    cancelled = result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  emitQueueUpdated(cancelled.hospital_id, {
    doctorId: cancelled.doctor_id,
    appointmentDate: cancelled.appointment_date,
  });
}

export async function getQueueForDoctor(hospitalId: string, doctorId: string, date: string): Promise<QueueToken[]> {
  const rows = await queueModel.listQueueForDoctorDate(hospitalId, doctorId, date);
  return rows.map(toQueueTokenDTO);
}

async function transitionToken(
  hospitalId: string,
  tokenId: string,
  fromAllowed: QueueStatus[],
  toStatus: QueueStatus,
  extra: { setCalledAt?: boolean; setCompletedAt?: boolean } = {},
): Promise<QueueToken> {
  const existing = await queueModel.findQueueTokenById(hospitalId, tokenId);
  if (!existing) {
    throw new AppError(404, "Queue token not found");
  }
  if (!fromAllowed.includes(existing.status)) {
    throw new AppError(400, `Cannot move a token from ${existing.status} to ${toStatus}`);
  }

  const row = await queueModel.updateQueueTokenStatus(hospitalId, tokenId, toStatus, extra);
  if (!row) {
    throw new AppError(404, "Queue token not found");
  }
  const dto = toQueueTokenDTO(row);
  emitQueueUpdated(hospitalId, dto);
  return dto;
}

export function callToken(hospitalId: string, tokenId: string): Promise<QueueToken> {
  return transitionToken(hospitalId, tokenId, ["WAITING"], "CALLED", { setCalledAt: true });
}

export function skipToken(hospitalId: string, tokenId: string): Promise<QueueToken> {
  return transitionToken(hospitalId, tokenId, ["WAITING", "CALLED"], "SKIPPED");
}

export function completeToken(hospitalId: string, tokenId: string): Promise<QueueToken> {
  return transitionToken(hospitalId, tokenId, ["CALLED", "IN_CONSULTATION"], "COMPLETED", { setCompletedAt: true });
}
