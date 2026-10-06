import { apiFetch } from "./apiClient";
import { DoctorScheduleWindow, QueueToken } from "../../../../shared/types/appointment";
import { SetDoctorScheduleInput } from "../../../../shared/validation/appointment.schema";

export const getDoctorSchedule = (doctorId: string) =>
  apiFetch<{ windows: DoctorScheduleWindow[] }>(`/hospital/doctors/${doctorId}/schedule`);

export const setDoctorSchedule = (doctorId: string, input: SetDoctorScheduleInput) =>
  apiFetch<{ windows: DoctorScheduleWindow[] }>(`/hospital/doctors/${doctorId}/schedule`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const getQueue = (doctorId: string, date: string) =>
  apiFetch<{ tokens: QueueToken[] }>(`/hospital/queue?doctorId=${doctorId}&date=${date}`);

export const callQueueToken = (tokenId: string) =>
  apiFetch<{ token: QueueToken }>(`/hospital/queue/${tokenId}/call`, { method: "PATCH" });

export const skipQueueToken = (tokenId: string) =>
  apiFetch<{ token: QueueToken }>(`/hospital/queue/${tokenId}/skip`, { method: "PATCH" });

export const completeQueueToken = (tokenId: string) =>
  apiFetch<{ token: QueueToken }>(`/hospital/queue/${tokenId}/complete`, { method: "PATCH" });
