import { attachDoctorContext, requireAuth, requireRole } from "./auth.middleware.js";
import AppError from "../utils/AppError.js";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export { attachDoctorContext, requireAuth, requireRole };

export const requirePatient = [requireAuth, requireRole("patient")];

export const validateUploadHistoryPayload = (req, _res, next) => {
  const { medicalData } = req.body || {};

  if (!medicalData || !medicalData.file) {
    return next(
      new AppError(400, "medicalData and its file property are required", "INVALID_UPLOAD_PAYLOAD"),
    );
  }

  const fileType = String(medicalData.fileType || "").toLowerCase();
  const fileData = String(medicalData.file || "");
  const isPdfType = fileType === "application/pdf";
  const isPdfDataUrl = fileData.startsWith("data:application/pdf;base64,");

  if (!isPdfType || !isPdfDataUrl) {
    return next(new AppError(400, "Only PDF files are allowed", "INVALID_FILE_TYPE"));
  }

  const fileBytesEstimate = Math.floor((fileData.length * 3) / 4);
  if (fileBytesEstimate > MAX_PDF_BYTES) {
    return next(new AppError(400, "PDF is too large. Max size is 10MB", "FILE_TOO_LARGE"));
  }

  req.medicalData = medicalData;
  next();
};
