import { Router } from "express";
import {
  uploadHistory,
  getPatientRecords,
  generateQrForExistingRecord,
} from "../controllers/patient.controller.js";
import wrapAsync from "../utils/wrapAsync.js";
import { requirePatient, validateUploadHistoryPayload } from "../middleware/index.js";

const router = Router();

router
  .route("/records")
  .post(requirePatient, validateUploadHistoryPayload, wrapAsync(uploadHistory))
  .get(requirePatient, wrapAsync(getPatientRecords));

router.post("/records/:id/qr", requirePatient, wrapAsync(generateQrForExistingRecord));

export default router;
