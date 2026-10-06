import { Router } from "express";
import * as ambulanceRequestController from "../controllers/ambulanceRequest.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(requireAuth, requireRole(ROLES.PATIENT));

router.post("/", ambulanceRequestController.createRequest);
router.get("/active", ambulanceRequestController.getActiveRequest);
router.get("/:id", ambulanceRequestController.getRequestDetail);
router.put("/:id/cancel", ambulanceRequestController.cancelRequest);

export default router;
