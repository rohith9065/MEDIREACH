import { Router } from "express";
import * as driverController from "../controllers/driver.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { attachDriverContext } from "../middleware/driver.middleware";
import { ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(requireAuth, requireRole(ROLES.AMBULANCE_DRIVER), attachDriverContext);

router.get("/me", driverController.getMe);
router.patch("/status", driverController.updateStatus);
router.patch("/location", driverController.updateLocation);

router.get("/requests/active", driverController.getActiveRequest);
router.post("/requests/:id/accept", driverController.acceptRequest);
router.post("/requests/:id/decline", driverController.declineRequest);
router.patch("/requests/:id/status", driverController.updateRequestStatus);

export default router;
