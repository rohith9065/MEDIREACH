import { Router } from "express";
import * as hospitalController from "../controllers/hospital.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/rbac.middleware";
import { attachHospitalContext } from "../middleware/hospital.middleware";
import { ROLES } from "../../../shared/constants/roles";

const router = Router();

// Every route here is a hospital admin managing their own hospital's data.
router.use(requireAuth, requireRole(ROLES.HOSPITAL_ADMIN), attachHospitalContext);

router.get("/me", hospitalController.getMyHospital);
router.put("/me", hospitalController.updateMyHospital);
router.put("/me/emergency-status", hospitalController.updateEmergencyStatus);

router.get("/dashboard", hospitalController.getDashboard);

router.get("/departments", hospitalController.listDepartments);
router.post("/departments", hospitalController.createDepartment);
router.put("/departments/:id", hospitalController.updateDepartment);

router.get("/doctors", hospitalController.listDoctors);
router.post("/doctors", hospitalController.createDoctor);
router.put("/doctors/:id", hospitalController.updateDoctor);
router.patch("/doctors/:id/status", hospitalController.updateDoctorStatus);

router.get("/beds", hospitalController.listBeds);
router.put("/beds/:bedType", hospitalController.updateBed);

router.get("/facilities", hospitalController.listFacilities);
router.put("/facilities/:facilityName", hospitalController.updateFacility);

router.get("/doctors/:id/schedule", hospitalController.getDoctorSchedule);
router.put("/doctors/:id/schedule", hospitalController.setDoctorSchedule);

router.get("/queue", hospitalController.getQueue);
router.patch("/queue/:tokenId/call", hospitalController.callQueueToken);
router.patch("/queue/:tokenId/skip", hospitalController.skipQueueToken);
router.patch("/queue/:tokenId/complete", hospitalController.completeQueueToken);

router.get("/ambulances", hospitalController.listAmbulances);
router.post("/ambulances", hospitalController.createAmbulance);

export default router;
