import { Router } from "express";
import {
  createProfileAccessRequest,
  listMyProfileAccessRequests,
  approveMyProfileAccessRequest,
  getDoctorProfileAccessRequest,
} from "../controllers/profileAccess.controller.js";
import { requirePatient, requireRole } from "../middleware/index.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = Router();

router.post("/requests", requireRole("doctor"), wrapAsync(createProfileAccessRequest));
router.get("/requests/patient", requirePatient, wrapAsync(listMyProfileAccessRequests));
router.post("/requests/:id/approve", requirePatient, wrapAsync(approveMyProfileAccessRequest));
router.get("/requests/:id", requireRole("doctor"), wrapAsync(getDoctorProfileAccessRequest));

export default router;
