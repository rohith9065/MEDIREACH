import { APPOINTMENT_STATUSES, QUEUE_STATUSES } from "../constants/appointment";

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface DoctorScheduleWindow {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface AvailableSlot {
  time: string; // "HH:MM"
}

export interface QueueToken {
  id: string;
  appointmentId: string;
  hospitalId: string;
  doctorId: string;
  patientId: string;
  patientName: string | null;
  tokenNumber: number;
  status: QueueStatus;
  createdAt: string;
  calledAt: string | null;
  completedAt: string | null;
}

// Patient-facing "My Appointments" shape — flattens the queue snapshot into the appointment
// itself (rather than nesting a separate QueueToken) since the app always shows them together.
export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string | null;
  hospitalId: string;
  hospitalName: string;
  appointmentDate: string; // "YYYY-MM-DD"
  appointmentTime: string; // "HH:MM"
  status: AppointmentStatus;
  tokenNumber: number;
  queueStatus: QueueStatus | null;
  currentServingToken: number | null;
  patientsAhead: number | null;
  createdAt: string;
}
