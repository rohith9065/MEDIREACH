import { pool } from "../config/db";
import { getIO, driverRoom, ambulanceRequestRoom } from "../sockets";
import * as ambulanceModel from "../models/ambulance.model";
import * as ambulanceRequestModel from "../models/ambulanceRequest.model";
import { createUser } from "../models/user.model";
import { hashPassword } from "../utils/password";
import { ROLES } from "../../../shared/constants/roles";
import { AMBULANCE_REQUEST_TRANSITIONS } from "../../../shared/constants/ambulance";
import {
  Ambulance,
  AmbulanceRequest,
  AmbulanceRequestDetail,
  AmbulanceRequestStatus,
} from "../../../shared/types/ambulance";
import { CreateAmbulanceInput, RequestAmbulanceInput } from "../../../shared/validation/ambulance.schema";
import { AppError } from "../utils/AppError";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

function toAmbulanceDTO(row: ambulanceModel.AmbulanceWithDriverRow): Ambulance {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    driverId: row.driver_id,
    driverName: row.driver_name,
    vehicleNumber: row.vehicle_number,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    lastLocationUpdate: row.last_location_update ? row.last_location_update.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toRequestDTO(row: ambulanceRequestModel.AmbulanceRequestRow): AmbulanceRequest {
  return {
    id: row.id,
    patientId: row.patient_id,
    ambulanceId: row.ambulance_id,
    hospitalId: row.hospital_id,
    pickupLatitude: row.pickup_latitude,
    pickupLongitude: row.pickup_longitude,
    destinationHospitalId: row.destination_hospital_id,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    requestedAt: row.requested_at.toISOString(),
    acceptedAt: row.accepted_at ? row.accepted_at.toISOString() : null,
    arrivedAt: row.arrived_at ? row.arrived_at.toISOString() : null,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

function toRequestDetailDTO(row: ambulanceRequestModel.AmbulanceRequestDetailRow): AmbulanceRequestDetail {
  return {
    ...toRequestDTO(row),
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleNumber: row.vehicle_number,
    ambulanceLatitude: row.ambulance_latitude,
    ambulanceLongitude: row.ambulance_longitude,
  };
}

function emitIncomingRequest(driverId: string, payload: unknown): void {
  getIO()?.to(driverRoom(driverId)).emit("ambulance:incoming-request", payload);
}

function emitRequestUpdated(requestId: string, payload: unknown): void {
  getIO()?.to(ambulanceRequestRoom(requestId)).emit("ambulance:request-updated", payload);
}

function emitLocationUpdated(requestId: string, payload: unknown): void {
  getIO()?.to(ambulanceRequestRoom(requestId)).emit("ambulance:location-updated", payload);
}

// ---------- Hospital-admin fleet management ----------

export async function createAmbulance(hospitalId: string, input: CreateAmbulanceInput): Promise<Ambulance> {
  const passwordHash = await hashPassword(input.driverPassword);
  const client = await pool.connect();
  let ambulanceId: string;
  try {
    await client.query("BEGIN");
    try {
      const driver = await createUser(
        { name: input.driverName, email: input.driverEmail, phone: input.driverPhone, passwordHash, role: ROLES.AMBULANCE_DRIVER },
        client,
      );
      const ambulance = await ambulanceModel.createAmbulance(
        hospitalId,
        driver.id,
        { vehicleNumber: input.vehicleNumber, latitude: input.latitude, longitude: input.longitude },
        client,
      );
      ambulanceId = ambulance.id;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(409, "That email or vehicle number is already registered");
      }
      throw err;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const list = await ambulanceModel.listAmbulancesForHospital(hospitalId);
  const created = list.find((a) => a.id === ambulanceId);
  if (!created) {
    throw new AppError(500, "Failed to load the newly created ambulance");
  }
  return toAmbulanceDTO(created);
}

export async function listAmbulances(hospitalId: string): Promise<Ambulance[]> {
  const rows = await ambulanceModel.listAmbulancesForHospital(hospitalId);
  return rows.map(toAmbulanceDTO);
}

// ---------- Driver ----------

async function requireOwnAmbulance(driverId: string): Promise<ambulanceModel.AmbulanceRow> {
  const ambulance = await ambulanceModel.findAmbulanceByDriverId(driverId);
  if (!ambulance) {
    throw new AppError(403, "You are not linked to an ambulance");
  }
  return ambulance;
}

export async function getMyAmbulance(driverId: string): Promise<Ambulance> {
  const ambulance = await requireOwnAmbulance(driverId);
  const list = await ambulanceModel.listAmbulancesForHospital(ambulance.hospital_id);
  const found = list.find((a) => a.id === ambulance.id);
  if (!found) {
    throw new AppError(500, "Failed to load ambulance");
  }
  return toAmbulanceDTO(found);
}

export async function setDriverStatus(driverId: string, status: "AVAILABLE" | "OFFLINE"): Promise<Ambulance> {
  const ambulance = await requireOwnAmbulance(driverId);
  if (ambulance.status === "ON_TRIP") {
    throw new AppError(400, "You can't change status while on a trip");
  }
  await ambulanceModel.setAmbulanceStatus(ambulance.id, status);
  const list = await ambulanceModel.listAmbulancesForHospital(ambulance.hospital_id);
  const updated = list.find((a) => a.id === ambulance.id);
  if (!updated) {
    throw new AppError(500, "Failed to load ambulance after status update");
  }
  return toAmbulanceDTO(updated);
}

export async function updateLocation(driverId: string, lat: number, lng: number): Promise<void> {
  const ambulance = await requireOwnAmbulance(driverId);
  await ambulanceModel.updateAmbulanceCurrentPosition(ambulance.id, lat, lng);

  const activeRequest = await ambulanceRequestModel.findActiveRequestForAmbulance(ambulance.id);
  if (activeRequest) {
    await ambulanceModel.insertAmbulanceLocationHistory(ambulance.id, lat, lng);
    emitLocationUpdated(activeRequest.id, { latitude: lat, longitude: lng });
  }
}

export async function getActiveRequestForDriver(driverId: string): Promise<AmbulanceRequestDetail | null> {
  const ambulance = await requireOwnAmbulance(driverId);
  const request = await ambulanceRequestModel.findActiveRequestForAmbulance(ambulance.id);
  if (!request) return null;
  return getRequestDetail(request.patient_id, request.id);
}

export async function acceptRequest(driverId: string, requestId: string): Promise<AmbulanceRequestDetail> {
  const ambulance = await requireOwnAmbulance(driverId);
  const request = await ambulanceRequestModel.findRequestById(requestId);
  if (!request || request.ambulance_id !== ambulance.id) {
    throw new AppError(404, "Request not found");
  }
  if (request.status !== "REQUESTED") {
    throw new AppError(400, `Cannot accept a request that is ${request.status}`);
  }

  await ambulanceRequestModel.updateStatus(requestId, "ACCEPTED", { setAcceptedAt: true });
  const detail = await getRequestDetail(request.patient_id, requestId);
  emitRequestUpdated(requestId, detail);
  return detail;
}

export async function declineRequest(driverId: string, requestId: string): Promise<void> {
  const ambulance = await requireOwnAmbulance(driverId);
  const request = await ambulanceRequestModel.findRequestById(requestId);
  if (!request || request.ambulance_id !== ambulance.id) {
    throw new AppError(404, "Request not found");
  }
  if (request.status !== "REQUESTED") {
    throw new AppError(400, `Cannot decline a request that is ${request.status}`);
  }

  const client = await pool.connect();
  let reassignedDriverId: string | null = null;
  let cancelled = false;
  try {
    await client.query("BEGIN");
    await ambulanceRequestModel.insertDecline(requestId, ambulance.id, client);
    await ambulanceModel.setAmbulanceStatus(ambulance.id, "AVAILABLE", client);

    const declinedIds = await ambulanceRequestModel.listDeclinedAmbulanceIds(requestId, client);
    const next = await ambulanceModel.findNearestAvailableAmbulance(
      request.pickup_latitude,
      request.pickup_longitude,
      declinedIds,
      client,
    );

    if (next) {
      await ambulanceModel.setAmbulanceStatus(next.id, "ON_TRIP", client);
      await ambulanceRequestModel.assignAmbulance(requestId, next.id, next.hospital_id, client);
      reassignedDriverId = next.driver_id;
    } else {
      await ambulanceRequestModel.cancelRequest(requestId, "NO_AMBULANCE_AVAILABLE", client);
      cancelled = true;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const detail = await getRequestDetail(request.patient_id, requestId);
  if (cancelled) {
    emitRequestUpdated(requestId, detail);
  } else if (reassignedDriverId) {
    emitIncomingRequest(reassignedDriverId, detail);
    emitRequestUpdated(requestId, detail);
  }
}

export async function updateRequestStatus(
  driverId: string,
  requestId: string,
  status: AmbulanceRequestStatus,
): Promise<AmbulanceRequestDetail> {
  const ambulance = await requireOwnAmbulance(driverId);
  const request = await ambulanceRequestModel.findRequestById(requestId);
  if (!request || request.ambulance_id !== ambulance.id) {
    throw new AppError(404, "Request not found");
  }
  if (AMBULANCE_REQUEST_TRANSITIONS[request.status] !== status) {
    throw new AppError(400, `Cannot move a request from ${request.status} to ${status}`);
  }

  await ambulanceRequestModel.updateStatus(requestId, status, {
    setArrivedAt: status === "ARRIVED_AT_PATIENT",
    setCompletedAt: status === "COMPLETED",
  });

  if (status === "COMPLETED") {
    await ambulanceModel.setAmbulanceStatus(ambulance.id, "AVAILABLE");
  }

  const detail = await getRequestDetail(request.patient_id, requestId);
  emitRequestUpdated(requestId, detail);
  return detail;
}

// ---------- Patient ----------

export async function requestAmbulance(patientId: string, input: RequestAmbulanceInput): Promise<AmbulanceRequestDetail> {
  const existing = await ambulanceRequestModel.findActiveRequestForPatient(patientId);
  if (existing) {
    throw new AppError(409, "You already have an active ambulance request");
  }

  const client = await pool.connect();
  let requestId: string;
  let driverId: string;
  try {
    await client.query("BEGIN");
    const nearest = await ambulanceModel.findNearestAvailableAmbulance(
      input.pickupLatitude,
      input.pickupLongitude,
      [],
      client,
    );
    if (!nearest) {
      throw new AppError(404, "No ambulances are currently available");
    }

    await ambulanceModel.setAmbulanceStatus(nearest.id, "ON_TRIP", client);
    const request = await ambulanceRequestModel.insertRequest(patientId, input, nearest.id, nearest.hospital_id, client);
    await client.query("COMMIT");
    requestId = request.id;
    driverId = nearest.driver_id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const detail = await getRequestDetail(patientId, requestId);
  emitIncomingRequest(driverId, detail);
  return detail;
}

export async function getActiveRequestForPatient(patientId: string): Promise<AmbulanceRequestDetail | null> {
  const request = await ambulanceRequestModel.findActiveRequestForPatient(patientId);
  if (!request) return null;
  return getRequestDetail(patientId, request.id);
}

export async function getRequestDetail(patientId: string, requestId: string): Promise<AmbulanceRequestDetail> {
  const row = await ambulanceRequestModel.findRequestDetailForPatient(requestId, patientId);
  if (!row) {
    throw new AppError(404, "Ambulance request not found");
  }
  return toRequestDetailDTO(row);
}

export async function cancelRequestByPatient(patientId: string, requestId: string): Promise<void> {
  const request = await ambulanceRequestModel.findRequestById(requestId);
  if (!request || request.patient_id !== patientId) {
    throw new AppError(404, "Ambulance request not found");
  }
  if (request.status === "COMPLETED" || request.status === "CANCELLED") {
    throw new AppError(400, "This request has already ended");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ambulanceRequestModel.cancelRequest(requestId, "CANCELLED_BY_PATIENT", client);
    if (request.ambulance_id) {
      await ambulanceModel.setAmbulanceStatus(request.ambulance_id, "AVAILABLE", client);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const detail = await getRequestDetail(patientId, requestId);
  emitRequestUpdated(requestId, detail);
}
