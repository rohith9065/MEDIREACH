import { apiFetch } from "./apiClient";
import { Ambulance, AmbulanceRequestDetail, AmbulanceRequestStatus } from "../../../../shared/types/ambulance";

export function getMyAmbulance(): Promise<{ ambulance: Ambulance }> {
  return apiFetch("/driver/me");
}

export function updateStatus(status: "AVAILABLE" | "OFFLINE"): Promise<{ ambulance: Ambulance }> {
  return apiFetch("/driver/status", { method: "PATCH", body: JSON.stringify({ status }) });
}

export function updateLocation(latitude: number, longitude: number): Promise<{ message: string }> {
  return apiFetch("/driver/location", { method: "PATCH", body: JSON.stringify({ latitude, longitude }) });
}

export function getActiveRequest(): Promise<{ request: AmbulanceRequestDetail | null }> {
  return apiFetch("/driver/requests/active");
}

export function acceptRequest(requestId: string): Promise<{ request: AmbulanceRequestDetail }> {
  return apiFetch(`/driver/requests/${requestId}/accept`, { method: "POST" });
}

export function declineRequest(requestId: string): Promise<{ message: string }> {
  return apiFetch(`/driver/requests/${requestId}/decline`, { method: "POST" });
}

export function updateRequestStatus(
  requestId: string,
  status: AmbulanceRequestStatus,
): Promise<{ request: AmbulanceRequestDetail }> {
  return apiFetch(`/driver/requests/${requestId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
