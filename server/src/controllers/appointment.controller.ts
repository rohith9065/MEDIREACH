import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as appointmentService from "../services/appointment.service";
import { bookAppointmentSchema } from "../../../shared/validation/appointment.schema";

function patientId(req: Request): string {
  return (req as AuthenticatedRequest).user!.id;
}

export const bookAppointment = asyncHandler(async (req: Request, res: Response) => {
  const input = bookAppointmentSchema.parse(req.body);
  const appointment = await appointmentService.bookAppointment(patientId(req), input);
  res.status(201).json({ appointment });
});

export const listMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const appointments = await appointmentService.listMyAppointments(patientId(req));
  res.status(200).json({ appointments });
});

export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  await appointmentService.cancelAppointment(patientId(req), req.params.id);
  res.status(200).json({ message: "Appointment cancelled" });
});
