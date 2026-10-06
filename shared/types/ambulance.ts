import { AMBULANCE_STATUSES, AMBULANCE_REQUEST_STATUSES } from "../constants/ambulance";

export type AmbulanceStatus = (typeof AMBULANCE_STATUSES)[number];
export type AmbulanceRequestStatus = (typeof AMBULANCE_REQUEST_STATUSES)[number];

export interface Ambulance {
  id: string;
  hospitalId: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  status: AmbulanceStatus;
  latitude: number | null;
  longitude: number | null;
  lastLocationUpdate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AmbulanceRequest {
  id: string;
  patientId: string;
  ambulanceId: string | null;
  hospitalId: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationHospitalId: string | null;
  status: AmbulanceRequestStatus;
  cancellationReason: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
}

// Patient tracking view — joins in driver/vehicle/current-position details the bare row
// doesn't have.
export interface AmbulanceRequestDetail extends AmbulanceRequest {
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  ambulanceLatitude: number | null;
  ambulanceLongitude: number | null;
}
