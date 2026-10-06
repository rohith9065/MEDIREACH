import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, registerHospitalSchema, loginSchema } from "../validators/auth.validators";
import * as authService from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AppError } from "../utils/AppError";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.registerPatient(input);
  res.status(201).json(result);
});

export const registerHospital = asyncHandler(async (req: Request, res: Response) => {
  const input = registerHospitalSchema.parse(req.body);
  const result = await authService.registerHospital(input);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.status(200).json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const authedReq = req as AuthenticatedRequest;
  if (!authedReq.user) {
    throw new AppError(401, "Authentication required");
  }
  const user = await authService.getCurrentUser(authedReq.user.id);
  res.status(200).json({ user });
});

export function logout(_req: Request, res: Response): void {
  // Stateless JWTs — nothing to invalidate server-side in Phase 1.
  // The client is expected to discard its token.
  res.status(200).json({ message: "Logged out. Discard your access token client-side." });
}
