import {
  NearbyHospitalSummary,
  HospitalPublicDetail,
  HospitalBedSummary,
  PublicDoctorSummary,
  PublicFacilitySummary,
} from "../../../shared/types/publicHospital";
import * as publicHospitalModel from "../models/publicHospital.model";
import * as bedModel from "../models/bed.model";
import * as doctorModel from "../models/doctor.model";
import * as facilityModel from "../models/facility.model";
import { AppError } from "../utils/AppError";

// Estimate only, not routing — surfaced to the client as an estimate (see spec's
// "travel time is an estimate, not a guarantee" disclaimer).
const AVG_CITY_SPEED_KMH = 30;

function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / AVG_CITY_SPEED_KMH) * 60));
}

function toBedSummaries(rows: bedModel.BedRow[]): HospitalBedSummary[] {
  return rows.map((r) => ({ bedType: r.bed_type, total: r.total_beds, available: r.available_beds }));
}

function latestTimestamp(dates: (Date | null | undefined)[]): string {
  const valid = dates.filter((d): d is Date => !!d);
  if (valid.length === 0) return new Date().toISOString();
  return new Date(Math.max(...valid.map((d) => d.getTime()))).toISOString();
}

// Smart-recommendation score (spec section 13). A convenience ranking, not medical advice.
// "Specialist"/"Facility" weight only applies when the caller actually asked for one — see
// the README/plan note on why those two are optional rather than always-on.
const SCORE_WEIGHTS = {
  distance: 25,
  specialist: 25,
  facility: 15,
  bed: 15,
  emergency: 10,
  freshness: 10,
};

// Phase 7 — emergency-triage ranking, used only when the caller passes emergencyMode=true.
// Status/beds dominate; distance still breaks near-ties but can't outweigh readiness the way
// it can in the standard blended score above.
const EMERGENCY_SCORE_WEIGHTS = {
  distance: 25,
  bed: 30,
  emergency: 35,
  freshness: 10,
};
const EMERGENCY_ETA_CAP_MINUTES = 45;

interface MatchInput {
  distanceKm: number;
  radiusKm: number;
  etaMinutes: number;
  beds: HospitalBedSummary[];
  emergencyStatus: string;
  doctors: doctorModel.DoctorRow[];
  facilities: facilityModel.FacilityRow[];
  dataUpdatedAt: string;
  specialization?: string;
  facilityQuery?: string;
  mode?: "standard" | "emergency";
}

function computeMatch(input: MatchInput): { matchScore: number; matchReasons: string[] } {
  const emergencyMode = input.mode === "emergency";
  const weights = emergencyMode ? EMERGENCY_SCORE_WEIGHTS : SCORE_WEIGHTS;
  const reasons: string[] = [];
  const active: { weight: number; score: number }[] = [];

  // Radius-relative distance scoring makes sense for "best overall hospital" but distorts
  // urgency in emergency mode (radiusKm is user-configurable) — use an ETA cap instead.
  const distanceScore = emergencyMode
    ? Math.max(0, 100 - (input.etaMinutes / EMERGENCY_ETA_CAP_MINUTES) * 100)
    : Math.max(0, 100 - (input.distanceKm / Math.max(input.radiusKm, 0.1)) * 100);
  active.push({ weight: weights.distance, score: distanceScore });
  reasons.push(emergencyMode ? `${input.etaMinutes} min away` : `${input.distanceKm} km away`);

  const bedsWithCapacity = input.beds.filter((b) => b.total > 0);
  const bedScore = bedsWithCapacity.length
    ? (bedsWithCapacity.reduce((sum, b) => sum + b.available / b.total, 0) / bedsWithCapacity.length) * 100
    : 0;
  active.push({ weight: weights.bed, score: bedScore });
  const icuBed = input.beds.find((b) => b.bedType === "ICU");
  if (icuBed && icuBed.available > 0) {
    reasons.push("ICU beds available");
  } else if (bedScore > 0) {
    reasons.push("Beds available");
  }

  const emergencyScore = input.emergencyStatus === "AVAILABLE" ? 100 : input.emergencyStatus === "LIMITED" ? 50 : 0;
  active.push({ weight: weights.emergency, score: emergencyScore });
  if (emergencyScore === 100) reasons.push("Emergency available");

  if (input.specialization) {
    const needle = input.specialization.toLowerCase();
    const matches = input.doctors.filter((d) => d.specialization?.toLowerCase().includes(needle));
    const specialistScore = matches.some((d) => d.status === "AVAILABLE") ? 100 : matches.length > 0 ? 50 : 0;
    active.push({ weight: SCORE_WEIGHTS.specialist, score: specialistScore });
    if (specialistScore === 100) reasons.push(`${input.specialization} available`);
  }

  if (input.facilityQuery) {
    const needle = input.facilityQuery.toLowerCase();
    const match = input.facilities.find((f) => f.facility_name.toLowerCase().includes(needle));
    const facilityScore = !match ? 0 : match.status === "AVAILABLE" ? 100 : match.status === "LIMITED" ? 50 : 0;
    active.push({ weight: SCORE_WEIGHTS.facility, score: facilityScore });
    if (facilityScore === 100) reasons.push(`${input.facilityQuery} available`);
  }

  const ageMinutes = (Date.now() - new Date(input.dataUpdatedAt).getTime()) / 60000;
  const freshnessScore = ageMinutes <= 5 ? 100 : ageMinutes <= 30 ? 80 : ageMinutes <= 120 ? 60 : ageMinutes <= 1440 ? 30 : 10;
  active.push({ weight: weights.freshness, score: freshnessScore });
  if (ageMinutes <= 30) reasons.push("Data updated recently");

  const totalWeight = active.reduce((sum, a) => sum + a.weight, 0);
  const weightedSum = active.reduce((sum, a) => sum + a.weight * a.score, 0);
  const matchScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return { matchScore, matchReasons: reasons };
}

export async function listNearbyHospitals(
  lat: number,
  lng: number,
  radiusKm: number,
  q?: string,
  specialization?: string,
  facility?: string,
  emergencyMode = false,
): Promise<NearbyHospitalSummary[]> {
  const hospitals = await publicHospitalModel.findNearbyHospitals(lat, lng, radiusKm, q, emergencyMode);

  const summaries = await Promise.all(
    hospitals.map(async (h) => {
      const [beds, doctors, facilities] = await Promise.all([
        bedModel.listBeds(h.id),
        doctorModel.listDoctors(h.id),
        facilityModel.listFacilities(h.id),
      ]);

      const bedSummaries = toBedSummaries(beds);
      const distanceKm = Math.round(h.distance_km * 10) / 10;
      const etaMinutes = estimateEtaMinutes(h.distance_km);
      const dataUpdatedAt = latestTimestamp([
        h.emergency_status_updated_at,
        h.updated_at,
        ...beds.map((b) => b.last_updated),
        ...facilities.map((f) => f.last_updated),
      ]);

      const { matchScore, matchReasons } = computeMatch({
        distanceKm,
        radiusKm,
        etaMinutes,
        beds: bedSummaries,
        emergencyStatus: h.emergency_status,
        doctors,
        facilities,
        dataUpdatedAt,
        specialization,
        facilityQuery: facility,
        mode: emergencyMode ? "emergency" : "standard",
      });

      return {
        id: h.id,
        name: h.name,
        address: h.address,
        phone: h.phone,
        emergencyPhone: h.emergency_phone,
        // SQL guarantees non-null lat/lng for rows that make it into this result set.
        latitude: h.latitude as number,
        longitude: h.longitude as number,
        distanceKm,
        etaMinutes,
        emergencyStatus: h.emergency_status,
        rating: h.rating ? Number(h.rating) : null,
        beds: bedSummaries,
        doctorCount: doctors.length,
        facilityCount: facilities.length,
        dataUpdatedAt,
        matchScore,
        matchReasons,
      };
    }),
  );

  return summaries.sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm);
}

export async function getHospitalPublicDetail(id: string): Promise<HospitalPublicDetail> {
  const hospital = await publicHospitalModel.findVerifiedHospitalById(id);
  if (!hospital) {
    throw new AppError(404, "Hospital not found");
  }

  const [beds, doctors, facilities] = await Promise.all([
    bedModel.listBeds(id),
    doctorModel.listDoctors(id),
    facilityModel.listFacilities(id),
  ]);

  const doctorSummaries: PublicDoctorSummary[] = doctors.map((d) => ({
    id: d.id,
    name: d.name,
    departmentName: d.department_name,
    specialization: d.specialization,
    status: d.status,
  }));

  const facilitySummaries: PublicFacilitySummary[] = facilities.map((f) => ({
    facilityName: f.facility_name,
    status: f.status,
    quantity: f.quantity,
  }));

  return {
    id: hospital.id,
    name: hospital.name,
    description: hospital.description,
    phone: hospital.phone,
    emergencyPhone: hospital.emergency_phone,
    address: hospital.address,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
    rating: hospital.rating ? Number(hospital.rating) : null,
    emergencyStatus: hospital.emergency_status,
    emergencyStatusUpdatedAt: hospital.emergency_status_updated_at
      ? hospital.emergency_status_updated_at.toISOString()
      : null,
    beds: toBedSummaries(beds),
    facilities: facilitySummaries,
    doctors: doctorSummaries,
    dataUpdatedAt: latestTimestamp([
      hospital.emergency_status_updated_at,
      hospital.updated_at,
      ...beds.map((b) => b.last_updated),
      ...facilities.map((f) => f.last_updated),
    ]),
  };
}
