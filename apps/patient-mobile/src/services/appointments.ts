import { apiFetch } from "./apiClient";
import { AvailableSlot, Appointment } from "../../../../shared/types/appointment";

export function getAvailableSlots(
  hospitalId: string,
  doctorId: string,
  date: string,
): Promise<{ slots: AvailableSlot[] }> {
  return apiFetch(`/hospitals/${hospitalId}/doctors/${doctorId}/slots?date=${date}`);
}

export interface BookAppointmentInput {
  hospitalId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
}

export function bookAppointment(input: BookAppointmentInput): Promise<{ appointment: Appointment }> {
  return apiFetch("/appointments", { method: "POST", body: JSON.stringify(input) });
}

export function getMyAppointments(): Promise<{ appointments: Appointment[] }> {
  return apiFetch("/appointments");
}

export function cancelAppointment(id: string): Promise<{ message: string }> {
  return apiFetch(`/appointments/${id}/cancel`, { method: "PUT" });
}
