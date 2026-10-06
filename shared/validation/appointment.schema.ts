import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const scheduleWindowSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_REGEX, "Expected HH:MM"),
    endTime: z.string().regex(TIME_REGEX, "Expected HH:MM"),
  })
  .refine((w) => w.endTime > w.startTime, { message: "endTime must be after startTime" });

export const setDoctorScheduleSchema = z.object({
  windows: z.array(scheduleWindowSchema).max(7),
});

export const slotsQuerySchema = z.object({
  date: z.string().regex(DATE_REGEX, "Expected YYYY-MM-DD"),
});

export const bookAppointmentSchema = z.object({
  hospitalId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentDate: z.string().regex(DATE_REGEX, "Expected YYYY-MM-DD"),
  appointmentTime: z.string().regex(TIME_REGEX, "Expected HH:MM"),
});

export const queueQuerySchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(DATE_REGEX, "Expected YYYY-MM-DD").optional(),
});

export type ScheduleWindowInput = z.infer<typeof scheduleWindowSchema>;
export type SetDoctorScheduleInput = z.infer<typeof setDoctorScheduleSchema>;
export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type QueueQueryInput = z.infer<typeof queueQuerySchema>;
