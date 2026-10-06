import { Router } from "express";
import authRoutes from "./auth.routes";
import hospitalRoutes from "./hospital.routes";
import publicHospitalRoutes from "./publicHospital.routes";
import appointmentRoutes from "./appointment.routes";
import adminRoutes from "./admin.routes";
import driverRoutes from "./driver.routes";
import ambulanceRequestRoutes from "./ambulanceRequest.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/hospital", hospitalRoutes);
router.use("/hospitals", publicHospitalRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/admin", adminRoutes);
router.use("/driver", driverRoutes);
router.use("/ambulance-requests", ambulanceRequestRoutes);

export default router;
