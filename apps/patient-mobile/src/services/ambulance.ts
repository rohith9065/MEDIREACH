import { apiFetch } from "./apiClient";
import { AmbulanceRequestDetail } from "../../../../shared/types/ambulance";
import { RequestAmbulanceInput } from "../../../../shared/validation/ambulance.schema";

export function requestAmbulance(input: RequestAmbulanceInput): Promise<{ request: AmbulanceRequestDetail }> {
  return apiFetch("/ambulance-requests", { method: "POST", body: JSON.stringify(input) });
}

export function getActiveAmbulanceRequest(): Promise<{ request: AmbulanceRequestDetail | null }> {
  return apiFetch("/ambulance-requests/active");
}

export function getAmbulanceRequestDetail(id: string): Promise<{ request: AmbulanceRequestDetail }> {
  return apiFetch(`/ambulance-requests/${id}`);
}

export function cancelAmbulanceRequest(id: string): Promise<{ message: string }> {
  return apiFetch(`/ambulance-requests/${id}/cancel`, { method: "PUT" });
}
