import { z } from "zod";

// Public self-registration creates PATIENT accounts here, and HOSPITAL_ADMIN accounts via
// registerHospitalSchema below (Phase 9). DOCTOR/AMBULANCE_DRIVER/SUPER_ADMIN are still
// provisioned via seed data / admin invite flows added in later phases.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number")
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

// Phase 9 — hospital self-registration. Creates a HOSPITAL_ADMIN user + a PENDING/unverified
// hospital + the hospital_staff link, atomically (see auth.service.ts's registerHospital).
// latitude/longitude are optional since there's no hospital profile-edit UI yet to add them
// later — a hospital without coordinates just won't appear in nearby-search once verified.
export const registerHospitalSchema = z.object({
  hospitalName: z.string().trim().min(2, "Hospital name must be at least 2 characters").max(200),
  registrationNumber: z.string().trim().min(3, "Registration number must be at least 3 characters").max(100),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  adminName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  adminEmail: z.string().trim().toLowerCase().email("Invalid email address"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterHospitalInput = z.infer<typeof registerHospitalSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
