import { apiFetch } from "./apiClient";
import { AuthResponse, PublicUser } from "../../../../shared/types/user";
import { LoginInput } from "../../../../shared/validation/auth.schema";

// Super admin accounts stay seed-provisioned — no self-registration here, unlike the patient
// and hospital-admin flows.
export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function fetchMe(): Promise<{ user: PublicUser }> {
  return apiFetch("/auth/me");
}
