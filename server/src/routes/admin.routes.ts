import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN));

router.get("/hospitals", adminController.listHospitals);
router.patch("/hospitals/:id/verify", adminController.verifyHospital);
router.patch("/hospitals/:id/reject", adminController.rejectHospital);

router.get("/users", adminController.listUsers);
router.patch("/users/:id/deactivate", adminController.deactivateUser);

router.get("/audit-logs", adminController.listAuditLogs);

export default router;
