import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { nearbyHospitalsQuerySchema } from "../../../shared/validation/publicHospital.schema";
import { slotsQuerySchema } from "../../../shared/validation/appointment.schema";
import * as publicHospitalService from "../services/publicHospital.service";
import * as appointmentService from "../services/appointment.service";
import * as doctorModel from "../models/doctor.model";
import { AppError } from "../utils/AppError";

export const getNearbyHospitals = asyncHandler(async (req: Request, res: Response) => {
  const query = nearbyHospitalsQuerySchema.parse(req.query);
  const hospitals = await publicHospitalService.listNearbyHospitals(
    query.lat,
    query.lng,
    query.radiusKm,
    query.q,
    query.specialization,
    query.facility,
    query.emergencyMode,
  );
  res.status(200).json({ hospitals });
});

export const getHospitalDetail = asyncHandler(async (req: Request, res: Response) => {
  const hospital = await publicHospitalService.getHospitalPublicDetail(req.params.id);
  res.status(200).json({ hospital });
});

export const getDoctorSlots = asyncHandler(async (req: Request, res: Response) => {
  const { date } = slotsQuerySchema.parse(req.query);
  const doctor = await doctorModel.findDoctorById(req.params.hospitalId, req.params.doctorId);
  if (!doctor) {
    throw new AppError(404, "Doctor not found at this hospital");
  }
  const slots = await appointmentService.getAvailableSlots(req.params.doctorId, date);
  res.status(200).json({ slots });
});
