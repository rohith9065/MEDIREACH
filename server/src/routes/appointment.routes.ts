import { Router } from "express";
import * as appointmentController from "../controllers/appointment.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { ROLES } from "../../../shared/constants/roles";

const router = Router();

// Booking is patient-only — hospital staff manage the queue via /api/hospital/queue instead.
router.use(requireAuth, requireRole(ROLES.PATIENT));

router.post("/", appointmentController.bookAppointment);
router.get("/", appointmentController.listMyAppointments);
router.put("/:id/cancel", appointmentController.cancelAppointment);

export default router;
