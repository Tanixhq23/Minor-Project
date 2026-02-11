import { Router } from "express";
import { getMyPatientLogs } from "../controllers/logs.controller.js";
import { requirePatient } from "../middleware/index.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = Router();

router.get("/me", requirePatient, wrapAsync(getMyPatientLogs));

export default router;
