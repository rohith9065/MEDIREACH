import { BED_TYPES, EMERGENCY_STATUSES, FACILITY_STATUSES, DOCTOR_STATUSES, DEPARTMENT_STATUSES, HOSPITAL_STATUSES } from "../constants/hospital";

export type BedType = (typeof BED_TYPES)[number];
export type EmergencyStatus = (typeof EMERGENCY_STATUSES)[number];
export type FacilityStatus = (typeof FACILITY_STATUSES)[number];
export type DoctorStatus = (typeof DOCTOR_STATUSES)[number];
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];
export type HospitalStatus = (typeof HOSPITAL_STATUSES)[number];

export interface Hospital {
  id: string;
  name: string;
  registrationNumber: string;
  description: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  verified: boolean;
  status: HospitalStatus;
  emergencyStatus: EmergencyStatus;
  emergencyStatusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  description: string | null;
  status: DepartmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  departmentId: string | null;
  departmentName: string | null;
  userId: string | null;
  name: string;
  specialization: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  status: DoctorStatus;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  hospitalId: string;
  bedType: BedType;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  lastUpdated: string;
  updatedBy: string | null;
}

export interface Facility {
  id: string;
  hospitalId: string;
  facilityName: string;
  status: FacilityStatus;
  quantity: number | null;
  lastUpdated: string;
  updatedBy: string | null;
}

export interface HospitalDashboardSummary {
  hospital: Hospital;
  bedTotals: { bedType: BedType; total: number; occupied: number; available: number }[];
  doctorCount: number;
  departmentCount: number;
  facilityCount: number;
}
