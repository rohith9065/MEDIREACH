export const AMBULANCE_STATUSES = ["AVAILABLE", "ON_TRIP", "OFFLINE", "MAINTENANCE"] as const;

export const AMBULANCE_REQUEST_STATUSES = [
  "REQUESTED",
  "ACCEPTED",
  "GOING_TO_PATIENT",
  "ARRIVED_AT_PATIENT",
  "GOING_TO_HOSPITAL",
  "ARRIVED_AT_HOSPITAL",
  "COMPLETED",
  "CANCELLED",
] as const;

// Forward-only transitions a driver can drive via PATCH /driver/requests/:id/status.
// REQUESTED (system-assigned) and CANCELLED (patient/system-only) aren't driver-settable here.
export const AMBULANCE_REQUEST_TRANSITIONS: Record<string, string> = {
  ACCEPTED: "GOING_TO_PATIENT",
  GOING_TO_PATIENT: "ARRIVED_AT_PATIENT",
  ARRIVED_AT_PATIENT: "GOING_TO_HOSPITAL",
  GOING_TO_HOSPITAL: "ARRIVED_AT_HOSPITAL",
  ARRIVED_AT_HOSPITAL: "COMPLETED",
};
