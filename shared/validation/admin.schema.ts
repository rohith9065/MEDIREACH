import { z } from "zod";
import { HOSPITAL_STATUSES } from "../constants/hospital";
import { ROLES } from "../constants/roles";
import { Role } from "../types/roles";

export const rejectHospitalSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const hospitalListQuerySchema = z.object({
  status: z.enum(HOSPITAL_STATUSES).optional(),
});

const ROLE_VALUES = Object.values(ROLES) as [Role, ...Role[]];

export const userListQuerySchema = z.object({
  role: z.enum(ROLE_VALUES).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type RejectHospitalInput = z.infer<typeof rejectHospitalSchema>;
export type HospitalListQuery = z.infer<typeof hospitalListQuerySchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
