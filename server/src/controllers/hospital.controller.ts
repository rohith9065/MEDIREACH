import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HospitalScopedRequest } from "../middleware/hospital.middleware";
import * as hospitalService from "../services/hospital.service";
import * as appointmentService from "../services/appointment.service";
import * as ambulanceService from "../services/ambulance.service";
import { createAmbulanceSchema } from "../../../shared/validation/ambulance.schema";
import {
  updateHospitalProfileSchema,
  updateEmergencyStatusSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createDoctorSchema,
  updateDoctorSchema,
  updateDoctorStatusSchema,
  updateBedSchema,
  bedTypeParamSchema,
  updateFacilitySchema,
  facilityNameParamSchema,
} from "../../../shared/validation/hospital.schema";
import { setDoctorScheduleSchema, queueQuerySchema } from "../../../shared/validation/appointment.schema";

function ctx(req: Request): { hospitalId: string; userId: string } {
  const hospitalReq = req as HospitalScopedRequest;
  return { hospitalId: hospitalReq.hospitalId as string, userId: hospitalReq.user!.id };
}

export const getMyHospital = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const hospital = await hospitalService.getHospitalProfile(hospitalId);
  res.status(200).json({ hospital });
});

export const updateMyHospital = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = updateHospitalProfileSchema.parse(req.body);
  const hospital = await hospitalService.updateHospitalProfile(hospitalId, input);
  res.status(200).json({ hospital });
});

export const updateEmergencyStatus = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = updateEmergencyStatusSchema.parse(req.body);
  const hospital = await hospitalService.updateEmergencyStatus(hospitalId, input);
  res.status(200).json({ hospital });
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const summary = await hospitalService.getDashboardSummary(hospitalId);
  res.status(200).json(summary);
});

export const listDepartments = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const departments = await hospitalService.listDepartments(hospitalId);
  res.status(200).json({ departments });
});

export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = createDepartmentSchema.parse(req.body);
  const department = await hospitalService.createDepartment(hospitalId, input);
  res.status(201).json({ department });
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = updateDepartmentSchema.parse(req.body);
  const department = await hospitalService.updateDepartment(hospitalId, req.params.id, input);
  res.status(200).json({ department });
});

export const listDoctors = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const doctors = await hospitalService.listDoctors(hospitalId);
  res.status(200).json({ doctors });
});

export const createDoctor = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = createDoctorSchema.parse(req.body);
  const doctor = await hospitalService.createDoctor(hospitalId, input);
  res.status(201).json({ doctor });
});

export const updateDoctor = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = updateDoctorSchema.parse(req.body);
  const doctor = await hospitalService.updateDoctor(hospitalId, req.params.id, input);
  res.status(200).json({ doctor });
});

export const updateDoctorStatus = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = updateDoctorStatusSchema.parse(req.body);
  const doctor = await hospitalService.updateDoctorStatus(hospitalId, req.params.id, input);
  res.status(200).json({ doctor });
});

export const listBeds = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const beds = await hospitalService.listBeds(hospitalId);
  res.status(200).json({ beds });
});

export const updateBed = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId, userId } = ctx(req);
  const { bedType } = bedTypeParamSchema.parse(req.params);
  const input = updateBedSchema.parse(req.body);
  const bed = await hospitalService.updateBed(hospitalId, bedType, input, userId);
  res.status(200).json({ bed });
});

export const listFacilities = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const facilities = await hospitalService.listFacilities(hospitalId);
  res.status(200).json({ facilities });
});

export const updateFacility = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId, userId } = ctx(req);
  const { facilityName } = facilityNameParamSchema.parse(req.params);
  const input = updateFacilitySchema.parse(req.body);
  const facility = await hospitalService.updateFacility(hospitalId, facilityName, input, userId);
  res.status(200).json({ facility });
});

export const getDoctorSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const windows = await appointmentService.getDoctorSchedule(hospitalId, req.params.id);
  res.status(200).json({ windows });
});

export const setDoctorSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = setDoctorScheduleSchema.parse(req.body);
  const windows = await appointmentService.setDoctorSchedule(hospitalId, req.params.id, input);
  res.status(200).json({ windows });
});

export const getQueue = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const { doctorId, date } = queueQuerySchema.parse(req.query);
  const today = new Date().toISOString().slice(0, 10);
  const tokens = await appointmentService.getQueueForDoctor(hospitalId, doctorId, date ?? today);
  res.status(200).json({ tokens });
});

export const callQueueToken = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const token = await appointmentService.callToken(hospitalId, req.params.tokenId);
  res.status(200).json({ token });
});

export const skipQueueToken = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const token = await appointmentService.skipToken(hospitalId, req.params.tokenId);
  res.status(200).json({ token });
});

export const completeQueueToken = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const token = await appointmentService.completeToken(hospitalId, req.params.tokenId);
  res.status(200).json({ token });
});

export const listAmbulances = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const ambulances = await ambulanceService.listAmbulances(hospitalId);
  res.status(200).json({ ambulances });
});

export const createAmbulance = asyncHandler(async (req: Request, res: Response) => {
  const { hospitalId } = ctx(req);
  const input = createAmbulanceSchema.parse(req.body);
  const ambulance = await ambulanceService.createAmbulance(hospitalId, input);
  res.status(201).json({ ambulance });
});
