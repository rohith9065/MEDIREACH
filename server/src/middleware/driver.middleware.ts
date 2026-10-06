import { Response } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";
import { findAmbulanceByDriverId } from "../models/ambulance.model";
import { asyncHandler } from "../utils/asyncHandler";

export interface DriverScopedRequest extends AuthenticatedRequest {
  ambulanceId?: string;
}

export const attachDriverContext = asyncHandler(async (req, _res: Response, next) => {
  const driverReq = req as DriverScopedRequest;
  if (!driverReq.user) {
    throw new AppError(401, "Authentication required");
  }

  const ambulance = await findAmbulanceByDriverId(driverReq.user.id);
  if (!ambulance) {
    throw new AppError(403, "You are not linked to an ambulance");
  }

  driverReq.ambulanceId = ambulance.id;
  next();
});
