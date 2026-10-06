import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as ambulanceService from "../services/ambulance.service";
import {
  updateDriverStatusSchema,
  updateLocationSchema,
  updateRequestStatusSchema,
} from "../../../shared/validation/ambulance.schema";

function driverId(req: Request): string {
  return (req as AuthenticatedRequest).user!.id;
}

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const ambulance = await ambulanceService.getMyAmbulance(driverId(req));
  res.status(200).json({ ambulance });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = updateDriverStatusSchema.parse(req.body);
  const ambulance = await ambulanceService.setDriverStatus(driverId(req), status);
  res.status(200).json({ ambulance });
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude } = updateLocationSchema.parse(req.body);
  await ambulanceService.updateLocation(driverId(req), latitude, longitude);
  res.status(200).json({ message: "Location updated" });
});

export const getActiveRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await ambulanceService.getActiveRequestForDriver(driverId(req));
  res.status(200).json({ request });
});

export const acceptRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await ambulanceService.acceptRequest(driverId(req), req.params.id);
  res.status(200).json({ request });
});

export const declineRequest = asyncHandler(async (req: Request, res: Response) => {
  await ambulanceService.declineRequest(driverId(req), req.params.id);
  res.status(200).json({ message: "Request declined" });
});

export const updateRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = updateRequestStatusSchema.parse(req.body);
  const request = await ambulanceService.updateRequestStatus(driverId(req), req.params.id, status);
  res.status(200).json({ request });
});
