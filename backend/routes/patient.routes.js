import { Router } from "express";
import {
  uploadHistory,
  getPatientRecords,
  generateQrForExistingRecord,
  deletePatientRecord,
  analyzePatientReport,
} from "../controllers/patient.controller.js";
import wrapAsync from "../utils/wrapAsync.js";
import { requirePatient, validateUploadHistoryPayload } from "../middleware/index.js";

const router = Router();

router
  .route("/records")
  .post(requirePatient, validateUploadHistoryPayload, wrapAsync(uploadHistory))
  .get(requirePatient, wrapAsync(getPatientRecords));

router.delete("/records/:id", requirePatient, wrapAsync(deletePatientRecord));
router.post("/records/:id/qr", requirePatient, wrapAsync(generateQrForExistingRecord));
router.post(
  "/report-analyzer",
  requirePatient,
  validateUploadHistoryPayload,
  wrapAsync(analyzePatientReport)
);

export default router;
