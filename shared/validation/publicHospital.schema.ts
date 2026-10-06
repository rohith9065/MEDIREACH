import { z } from "zod";

export const nearbyHospitalsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).optional().default(15),
  q: z.string().trim().min(1).max(150).optional(),
  // Optional match-score inputs (Phase 4). When omitted, the smart-recommendation score is
  // computed from distance/bed/emergency/freshness only — see publicHospital.service.ts.
  specialization: z.string().trim().min(1).max(150).optional(),
  facility: z.string().trim().min(1).max(100).optional(),
  // Phase 7: switches computeMatch to the emergency-triage weight table (see
  // publicHospital.service.ts) and excludes UNAVAILABLE hospitals server-side. Deliberately
  // NOT z.coerce.boolean() — Boolean("false") is true, which would silently force this on.
  emergencyMode: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type NearbyHospitalsQuery = z.infer<typeof nearbyHospitalsQuerySchema>;
