import * as recordsService from "../services/records.service.js";
import * as logService from "../services/log.service.js";
import { sendQrAccessedEmail } from "../services/notification.js";
import { verifyRecordAccessToken } from "../utils/token.js";
import Doctor from "../models/doctor.model.js";
import AppError from "../utils/AppError.js";

const isJwtFailure = (err) => err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError";

export const getRecord = async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  if (!token) {
    throw new AppError(401, "token is required", "TOKEN_REQUIRED");
  }

  try {
    verifyRecordAccessToken(String(token), String(id));
  } catch (err) {
    if (isJwtFailure(err)) {
      throw new AppError(401, err.message || "Invalid token", "INVALID_TOKEN");
    }
    throw err;
  }

  const record = await recordsService.getRecordById(id);
  if (!record) {
    throw new AppError(404, "Record not found", "RECORD_NOT_FOUND");
  }

  const log = await logService.logRecordViewed({
    patientId: record.patient._id,
    recordId: record._id,
    doctorId: req.doctorContext?.id,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    meta: { via: "qr" },
  });

  const when = new Date().toISOString();
  const accessUrl = record.accessUrl;

  sendQrAccessedEmail({
    email: record.patient?.email,
    name: record.patient?.name,
    recordId: record._id,
    accessUrl,
    when,
    recipientRole: "patient",
  }).catch(() => {});

  if (req.doctorContext?.id) {
    const doctor = await Doctor.findById(req.doctorContext.id);
    if (doctor?.email) {
      sendQrAccessedEmail({
        email: doctor.email,
        name: doctor.name,
        recordId: record._id,
        accessUrl,
        when,
        recipientRole: "doctor",
      }).catch(() => {});
    }
  }

  return res.json({
    success: true,
    data: {
      recordId: record._id,
      medicalData: record.medicalData,
      accessedLogId: log._id,
      patient: record.patient
        ? {
            id: record.patient._id,
            name: record.patient.name,
            email: record.patient.email,
            phone: record.patient.phone,
          }
        : null,
    },
  });
};
