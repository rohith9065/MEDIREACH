import {
  Hospital,
  Department,
  Doctor,
  Bed,
  Facility,
  HospitalDashboardSummary,
} from "../../../shared/types/hospital";
import {
  UpdateHospitalProfileInput,
  UpdateEmergencyStatusInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateDoctorInput,
  UpdateDoctorInput,
  UpdateDoctorStatusInput,
  UpdateBedInput,
  UpdateFacilityInput,
} from "../../../shared/validation/hospital.schema";
import { BedType, FacilityStatus } from "../../../shared/types/hospital";
import * as hospitalModel from "../models/hospital.model";
import * as departmentModel from "../models/department.model";
import * as doctorModel from "../models/doctor.model";
import * as bedModel from "../models/bed.model";
import * as facilityModel from "../models/facility.model";
import { AppError } from "../utils/AppError";
import { getIO, hospitalRoom } from "../sockets";

function emitToHospital(hospitalId: string, event: string, payload: unknown): void {
  getIO()?.to(hospitalRoom(hospitalId)).emit(event, payload);
}

function toHospitalDTO(row: hospitalModel.HospitalRow): Hospital {
  return {
    id: row.id,
    name: row.name,
    registrationNumber: row.registration_number,
    description: row.description,
    phone: row.phone,
    emergencyPhone: row.emergency_phone,
    email: row.email,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating ? Number(row.rating) : null,
    verified: row.verified,
    status: row.status,
    emergencyStatus: row.emergency_status,
    emergencyStatusUpdatedAt: row.emergency_status_updated_at ? row.emergency_status_updated_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toDepartmentDTO(row: departmentModel.DepartmentRow): Department {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toDoctorDTO(row: doctorModel.DoctorRow): Doctor {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    userId: row.user_id,
    name: row.name,
    specialization: row.specialization,
    experienceYears: row.experience_years,
    consultationFee: row.consultation_fee ? Number(row.consultation_fee) : null,
    status: row.status,
    profileImage: row.profile_image,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toBedDTO(row: bedModel.BedRow): Bed {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    bedType: row.bed_type,
    totalBeds: row.total_beds,
    occupiedBeds: row.occupied_beds,
    availableBeds: row.available_beds,
    lastUpdated: row.last_updated.toISOString(),
    updatedBy: row.updated_by,
  };
}

function toFacilityDTO(row: facilityModel.FacilityRow): Facility {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    facilityName: row.facility_name,
    status: row.status,
    quantity: row.quantity,
    lastUpdated: row.last_updated.toISOString(),
    updatedBy: row.updated_by,
  };
}

export async function getHospitalProfile(hospitalId: string): Promise<Hospital> {
  const row = await hospitalModel.findHospitalById(hospitalId);
  if (!row) {
    throw new AppError(404, "Hospital not found");
  }
  return toHospitalDTO(row);
}

export async function updateHospitalProfile(hospitalId: string, input: UpdateHospitalProfileInput): Promise<Hospital> {
  const row = await hospitalModel.updateHospitalProfile(hospitalId, input);
  if (!row) {
    throw new AppError(404, "Hospital not found");
  }
  return toHospitalDTO(row);
}

export async function updateEmergencyStatus(hospitalId: string, input: UpdateEmergencyStatusInput): Promise<Hospital> {
  const row = await hospitalModel.updateEmergencyStatus(hospitalId, input.emergencyStatus);
  if (!row) {
    throw new AppError(404, "Hospital not found");
  }
  const hospital = toHospitalDTO(row);
  emitToHospital(hospitalId, "hospital:emergency-updated", hospital);
  return hospital;
}

export async function listDepartments(hospitalId: string): Promise<Department[]> {
  const rows = await departmentModel.listDepartments(hospitalId);
  return rows.map(toDepartmentDTO);
}

export async function createDepartment(hospitalId: string, input: CreateDepartmentInput): Promise<Department> {
  const row = await departmentModel.createDepartment(hospitalId, input.name, input.description);
  return toDepartmentDTO(row);
}

export async function updateDepartment(
  hospitalId: string,
  id: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  const row = await departmentModel.updateDepartment(hospitalId, id, input);
  if (!row) {
    throw new AppError(404, "Department not found");
  }
  return toDepartmentDTO(row);
}

export async function listDoctors(hospitalId: string): Promise<Doctor[]> {
  const rows = await doctorModel.listDoctors(hospitalId);
  return rows.map(toDoctorDTO);
}

export async function createDoctor(hospitalId: string, input: CreateDoctorInput): Promise<Doctor> {
  const row = await doctorModel.createDoctor(hospitalId, input);
  return toDoctorDTO(row);
}

export async function updateDoctor(hospitalId: string, id: string, input: UpdateDoctorInput): Promise<Doctor> {
  const row = await doctorModel.updateDoctor(hospitalId, id, input);
  if (!row) {
    throw new AppError(404, "Doctor not found");
  }
  const doctor = toDoctorDTO(row);
  emitToHospital(hospitalId, "hospital:doctor-updated", doctor);
  return doctor;
}

export async function updateDoctorStatus(hospitalId: string, id: string, input: UpdateDoctorStatusInput): Promise<Doctor> {
  const row = await doctorModel.updateDoctorStatus(hospitalId, id, input.status);
  if (!row) {
    throw new AppError(404, "Doctor not found");
  }
  const doctor = toDoctorDTO(row);
  emitToHospital(hospitalId, "hospital:doctor-updated", doctor);
  return doctor;
}

export async function listBeds(hospitalId: string): Promise<Bed[]> {
  const rows = await bedModel.listBeds(hospitalId);
  return rows.map(toBedDTO);
}

export async function updateBed(
  hospitalId: string,
  bedType: BedType,
  input: UpdateBedInput,
  updatedBy: string,
): Promise<Bed> {
  const row = await bedModel.upsertBed(hospitalId, bedType, input.totalBeds, input.occupiedBeds, updatedBy);
  const bed = toBedDTO(row);
  emitToHospital(hospitalId, "hospital:bed-updated", bed);
  return bed;
}

export async function listFacilities(hospitalId: string): Promise<Facility[]> {
  const rows = await facilityModel.listFacilities(hospitalId);
  return rows.map(toFacilityDTO);
}

export async function updateFacility(
  hospitalId: string,
  facilityName: string,
  input: UpdateFacilityInput,
  updatedBy: string,
): Promise<Facility> {
  const row = await facilityModel.upsertFacility(
    hospitalId,
    facilityName,
    input.status as FacilityStatus,
    input.quantity,
    updatedBy,
  );
  const facility = toFacilityDTO(row);
  emitToHospital(hospitalId, "hospital:facility-updated", facility);
  return facility;
}

export async function getDashboardSummary(hospitalId: string): Promise<HospitalDashboardSummary> {
  const [hospital, beds, doctors, departments, facilities] = await Promise.all([
    getHospitalProfile(hospitalId),
    listBeds(hospitalId),
    listDoctors(hospitalId),
    listDepartments(hospitalId),
    listFacilities(hospitalId),
  ]);

  return {
    hospital,
    bedTotals: beds.map((b) => ({ bedType: b.bedType, total: b.totalBeds, occupied: b.occupiedBeds, available: b.availableBeds })),
    doctorCount: doctors.length,
    departmentCount: departments.length,
    facilityCount: facilities.length,
  };
}
