import { apiFetch } from "./apiClient";
import {
  Hospital,
  Department,
  Doctor,
  Bed,
  Facility,
  HospitalDashboardSummary,
  BedType,
  EmergencyStatus,
  DoctorStatus,
} from "../../../../shared/types/hospital";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateDoctorInput,
  UpdateDoctorInput,
  UpdateBedInput,
  UpdateFacilityInput,
} from "../../../../shared/validation/hospital.schema";
import { Ambulance } from "../../../../shared/types/ambulance";
import { CreateAmbulanceInput } from "../../../../shared/validation/ambulance.schema";

export const getDashboard = () => apiFetch<HospitalDashboardSummary>("/hospital/dashboard");

export const getMyHospital = () => apiFetch<{ hospital: Hospital }>("/hospital/me");
export const updateEmergencyStatus = (emergencyStatus: EmergencyStatus) =>
  apiFetch<{ hospital: Hospital }>("/hospital/me/emergency-status", {
    method: "PUT",
    body: JSON.stringify({ emergencyStatus }),
  });

export const listDepartments = () => apiFetch<{ departments: Department[] }>("/hospital/departments");
export const createDepartment = (input: CreateDepartmentInput) =>
  apiFetch<{ department: Department }>("/hospital/departments", { method: "POST", body: JSON.stringify(input) });
export const updateDepartment = (id: string, input: UpdateDepartmentInput) =>
  apiFetch<{ department: Department }>(`/hospital/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const listDoctors = () => apiFetch<{ doctors: Doctor[] }>("/hospital/doctors");
export const createDoctor = (input: CreateDoctorInput) =>
  apiFetch<{ doctor: Doctor }>("/hospital/doctors", { method: "POST", body: JSON.stringify(input) });
export const updateDoctor = (id: string, input: UpdateDoctorInput) =>
  apiFetch<{ doctor: Doctor }>(`/hospital/doctors/${id}`, { method: "PUT", body: JSON.stringify(input) });
export const updateDoctorStatus = (id: string, status: DoctorStatus) =>
  apiFetch<{ doctor: Doctor }>(`/hospital/doctors/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const listBeds = () => apiFetch<{ beds: Bed[] }>("/hospital/beds");
export const updateBed = (bedType: BedType, input: UpdateBedInput) =>
  apiFetch<{ bed: Bed }>(`/hospital/beds/${bedType}`, { method: "PUT", body: JSON.stringify(input) });

export const listFacilities = () => apiFetch<{ facilities: Facility[] }>("/hospital/facilities");
export const updateFacility = (facilityName: string, input: UpdateFacilityInput) =>
  apiFetch<{ facility: Facility }>(`/hospital/facilities/${facilityName}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

export const listAmbulances = () => apiFetch<{ ambulances: Ambulance[] }>("/hospital/ambulances");
export const createAmbulance = (input: CreateAmbulanceInput) =>
  apiFetch<{ ambulance: Ambulance }>("/hospital/ambulances", { method: "POST", body: JSON.stringify(input) });
