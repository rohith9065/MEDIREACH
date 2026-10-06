import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as ambulanceService from "../services/ambulance.service";
import { requestAmbulanceSchema } from "../../../shared/validation/ambulance.schema";

function patientId(req: Request): string {
  return (req as AuthenticatedRequest).user!.id;
}

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const input = requestAmbulanceSchema.parse(req.body);
  const request = await ambulanceService.requestAmbulance(patientId(req), input);
  res.status(201).json({ request });
});

export const getActiveRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await ambulanceService.getActiveRequestForPatient(patientId(req));
  res.status(200).json({ request });
});

export const getRequestDetail = asyncHandler(async (req: Request, res: Response) => {
  const request = await ambulanceService.getRequestDetail(patientId(req), req.params.id);
  res.status(200).json({ request });
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  await ambulanceService.cancelRequestByPatient(patientId(req), req.params.id);
  res.status(200).json({ message: "Ambulance request cancelled" });
});
