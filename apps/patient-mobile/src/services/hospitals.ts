import { apiFetch } from "./apiClient";
import { NearbyHospitalSummary, HospitalPublicDetail } from "../../../../shared/types/publicHospital";

export interface NearbyParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  q?: string;
  // Optional match-score inputs (Phase 4) — no UI picks these yet, but the API and this
  // client already support them for when a specialization/facility filter lands (Phase 6).
  specialization?: string;
  facility?: string;
  // Phase 7: switches the backend to the emergency-triage ranking and excludes UNAVAILABLE
  // hospitals — used only by EmergencyScreen.
  emergencyMode?: boolean;
}

export function getNearbyHospitals(params: NearbyParams): Promise<{ hospitals: NearbyHospitalSummary[] }> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    ...(params.radiusKm ? { radiusKm: String(params.radiusKm) } : {}),
    ...(params.q ? { q: params.q } : {}),
    ...(params.specialization ? { specialization: params.specialization } : {}),
    ...(params.facility ? { facility: params.facility } : {}),
    ...(params.emergencyMode ? { emergencyMode: "true" } : {}),
  });
  return apiFetch(`/hospitals/nearby?${query.toString()}`);
}

export function getHospitalDetail(id: string): Promise<{ hospital: HospitalPublicDetail }> {
  return apiFetch(`/hospitals/${id}`);
}
