import { Router } from "express";
import * as publicHospitalController from "../controllers/publicHospital.controller";
import { publicRateLimit } from "../middleware/publicRateLimit.middleware";

const router = Router();

router.use(publicRateLimit);

// "/nearby" must stay registered before "/:id" or the param route would swallow it.
router.get("/nearby", publicHospitalController.getNearbyHospitals);
router.get("/:hospitalId/doctors/:doctorId/slots", publicHospitalController.getDoctorSlots);
router.get("/:id", publicHospitalController.getHospitalDetail);

export default router;
