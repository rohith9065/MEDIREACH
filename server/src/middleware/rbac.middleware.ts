import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";
import { Role } from "../../../shared/types/roles";

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission to perform this action");
    }
    next();
  };
}
