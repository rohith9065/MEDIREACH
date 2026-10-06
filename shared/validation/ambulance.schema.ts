import { z } from "zod";

export const createAmbulanceSchema = z.object({
  driverName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  driverEmail: z.string().trim().toLowerCase().email("Invalid email address"),
  driverPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  driverPhone: z.string().trim().max(20).optional(),
  vehicleNumber: z.string().trim().min(3, "Vehicle number must be at least 3 characters").max(20),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const updateDriverStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OFFLINE"]),
});

export const updateLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const requestAmbulanceSchema = z.object({
  pickupLatitude: z.coerce.number().min(-90).max(90),
  pickupLongitude: z.coerce.number().min(-180).max(180),
  destinationHospitalId: z.string().uuid().optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(["GOING_TO_PATIENT", "ARRIVED_AT_PATIENT", "GOING_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL", "COMPLETED"]),
});

export type CreateAmbulanceInput = z.infer<typeof createAmbulanceSchema>;
export type UpdateDriverStatusInput = z.infer<typeof updateDriverStatusSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type RequestAmbulanceInput = z.infer<typeof requestAmbulanceSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
