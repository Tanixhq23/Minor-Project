const router = require("express").Router();
const patientController = require("../controllers/patientController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { documentUpload } = require("../middlewares/uploadMiddleware");
const { validateRequest } = require("../middlewares/validationMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { consentIdValidation, patientFileValidation } = require("../validations/patientValidation");

router.use(requireAuth, requireRole("patient"));

router.post(
  "/documents",
  documentUpload.single("file"),
  validateRequest(patientFileValidation),
  asyncHandler(patientController.uploadDocument)
);
router.get("/documents", asyncHandler(patientController.listDocuments));
router.get("/documents/stream/:documentId", asyncHandler(patientController.streamDocument));
router.post("/access/qr", asyncHandler(patientController.createQrAccess));
router.post("/access/otp", asyncHandler(patientController.createOtpAccess));
router.get("/access/active", asyncHandler(patientController.listActiveAccess));
router.delete(
  "/access/:consentId",
  validateRequest(consentIdValidation),
  asyncHandler(patientController.revokeAccess)
);

router.delete("/documents/:documentId", asyncHandler(patientController.deleteDocument));
router.get("/logs", asyncHandler(patientController.getLogs));
router.get("/permissions", asyncHandler(patientController.getDownloadRequests));
router.patch("/permissions/:requestId", asyncHandler(patientController.respondToRequest));

module.exports = router;
