import { z } from "zod";
import { BED_TYPES, EMERGENCY_STATUSES, FACILITY_STATUSES, DOCTOR_STATUSES, DEPARTMENT_STATUSES } from "../constants/hospital";

export const updateHospitalProfileSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(20).optional(),
  emergencyPhone: z.string().trim().max(20).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  address: z.string().trim().max(500).optional(),
});

export const updateEmergencyStatusSchema = z.object({
  emergencyStatus: z.enum(EMERGENCY_STATUSES),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(DEPARTMENT_STATUSES).optional(),
});

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2).max(150),
  departmentId: z.string().uuid().optional(),
  specialization: z.string().trim().max(150).optional(),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  consultationFee: z.coerce.number().min(0).optional(),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export const updateDoctorStatusSchema = z.object({
  status: z.enum(DOCTOR_STATUSES),
});

export const updateBedSchema = z.object({
  totalBeds: z.coerce.number().int().min(0),
  occupiedBeds: z.coerce.number().int().min(0),
});

export const bedTypeParamSchema = z.object({
  bedType: z.enum(BED_TYPES),
});

export const updateFacilitySchema = z.object({
  status: z.enum(FACILITY_STATUSES),
  quantity: z.coerce.number().int().min(0).optional(),
});

export const facilityNameParamSchema = z.object({
  facilityName: z.string().trim().min(1).max(100),
});

export type UpdateHospitalProfileInput = z.infer<typeof updateHospitalProfileSchema>;
export type UpdateEmergencyStatusInput = z.infer<typeof updateEmergencyStatusSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type UpdateDoctorStatusInput = z.infer<typeof updateDoctorStatusSchema>;
export type UpdateBedInput = z.infer<typeof updateBedSchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;
