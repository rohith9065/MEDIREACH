import { apiFetch } from "./apiClient";
import { AuthResponse, PublicUser } from "../../../../shared/types/user";
import { LoginInput, RegisterInput } from "../../../../shared/validation/auth.schema";

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export function fetchMe(): Promise<{ user: PublicUser }> {
  return apiFetch("/auth/me");
}
