import { EmergencyStatus, BedType, DoctorStatus, FacilityStatus } from "./hospital";

export interface HospitalBedSummary {
  bedType: BedType;
  total: number;
  available: number;
}

export interface NearbyHospitalSummary {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  etaMinutes: number;
  emergencyStatus: EmergencyStatus;
  rating: number | null;
  beds: HospitalBedSummary[];
  doctorCount: number;
  facilityCount: number;
  dataUpdatedAt: string;
  /** 0-100 smart-recommendation score. Not medical advice — see spec section 13. */
  matchScore: number;
  /** Short "why recommended" strings, e.g. "Emergency available", "2.1 km away". */
  matchReasons: string[];
}

export interface PublicDoctorSummary {
  id: string;
  name: string;
  departmentName: string | null;
  specialization: string | null;
  status: DoctorStatus;
}

export interface PublicFacilitySummary {
  facilityName: string;
  status: FacilityStatus;
  quantity: number | null;
}

export interface HospitalPublicDetail {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  emergencyStatus: EmergencyStatus;
  emergencyStatusUpdatedAt: string | null;
  beds: HospitalBedSummary[];
  facilities: PublicFacilitySummary[];
  doctors: PublicDoctorSummary[];
  dataUpdatedAt: string;
}
