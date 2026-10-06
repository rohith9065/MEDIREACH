import { Response } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";
import { findHospitalIdForUser } from "../models/hospital.model";
import { asyncHandler } from "../utils/asyncHandler";

export interface HospitalScopedRequest extends AuthenticatedRequest {
  hospitalId?: string;
}

export const attachHospitalContext = asyncHandler(async (req, _res: Response, next) => {
  const hospitalReq = req as HospitalScopedRequest;
  if (!hospitalReq.user) {
    throw new AppError(401, "Authentication required");
  }

  const hospitalId = await findHospitalIdForUser(hospitalReq.user.id);
  if (!hospitalId) {
    throw new AppError(403, "You are not linked to a hospital");
  }

  hospitalReq.hospitalId = hospitalId;
  next();
});
