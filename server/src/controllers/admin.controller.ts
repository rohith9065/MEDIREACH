import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as adminService from "../services/admin.service";
import { hospitalListQuerySchema, userListQuerySchema, rejectHospitalSchema } from "../../../shared/validation/admin.schema";

function actorId(req: Request): string {
  return (req as AuthenticatedRequest).user!.id;
}

export const listHospitals = asyncHandler(async (req: Request, res: Response) => {
  const { status } = hospitalListQuerySchema.parse(req.query);
  const hospitals = await adminService.listHospitals(status);
  res.status(200).json({ hospitals });
});

export const verifyHospital = asyncHandler(async (req: Request, res: Response) => {
  const hospital = await adminService.verifyHospital(req.params.id, actorId(req));
  res.status(200).json({ hospital });
});

export const rejectHospital = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = rejectHospitalSchema.parse(req.body);
  const hospital = await adminService.rejectHospital(req.params.id, actorId(req), reason);
  res.status(200).json({ hospital });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, isActive } = userListQuerySchema.parse(req.query);
  const users = await adminService.listUsers({ role, isActive });
  res.status(200).json({ users });
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.deactivateUser(req.params.id, actorId(req));
  res.status(200).json({ user });
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const logs = await adminService.listAuditLogs(limit, offset);
  res.status(200).json({ logs });
});
