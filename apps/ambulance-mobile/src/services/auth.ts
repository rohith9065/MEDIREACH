import { apiFetch } from "./apiClient";
import { AuthResponse, PublicUser } from "../../../../shared/types/user";
import { LoginInput } from "../../../../shared/validation/auth.schema";

// Drivers are provisioned by a hospital admin (see apps/hospital-web's Ambulances page) — no
// self-registration here.
export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function fetchMe(): Promise<{ user: PublicUser }> {
  return apiFetch("/auth/me");
}
