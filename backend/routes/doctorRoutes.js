const router = require("express").Router();
const doctorController = require("../controllers/doctorController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireConsent } = require("../middlewares/consentMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { qrImageUpload } = require("../middlewares/uploadMiddleware");
const { validateRequest } = require("../middlewares/validationMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { otpValidation, qrImageValidation, qrTokenValidation } = require("../validations/doctorValidation");

router.use(requireAuth, requireRole("doctor"));

router.post("/access/qr", validateRequest(qrTokenValidation), asyncHandler(doctorController.accessWithQr));
router.post("/access/otp", validateRequest(otpValidation), asyncHandler(doctorController.accessWithOtp));
router.post(
  "/access/qr-image",
  qrImageUpload.single("qr"),
  validateRequest(qrImageValidation),
  asyncHandler(doctorController.accessWithQrImage)
);

router.get("/patient/:patientId", requireConsent, asyncHandler(doctorController.getPatientProfile));
router.get("/patient/:patientId/documents", requireConsent, asyncHandler(doctorController.getPatientDocuments));
router.get(
  "/patient/:patientId/documents/stream/:documentId",
  requireConsent,
  asyncHandler(doctorController.streamDocument)
);

router.post(
  "/patient/:patientId/documents/:documentId/request",
  asyncHandler(doctorController.requestDownload)
);

router.get("/history", asyncHandler(doctorController.getHistory));

module.exports = router;
