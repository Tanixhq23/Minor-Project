import * as recordsService from "../services/records.service.js";
import * as logService from "../services/log.service.js";
import { sendQrAccessedEmail } from "../services/notification.js";
import { verifyRecordAccessToken } from "../utils/token.js";
import Doctor from "../models/doctor.model.js";

export const getRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    if (!token) {
      return res.status(401).json({ success: false, error: { message: "token is required" } });
    }
    // Verify token and subject
    verifyRecordAccessToken(String(token), String(id));

    const record = await recordsService.getRecordById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: { message: "Record not found" } });
    }

    // Log access
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

    // Return the medical data
    return res.json({
      success: true,
      data: { recordId: record._id, medicalData: record.medicalData, accessedLogId: log._id },
    });
  } catch (err) {
    err.status = err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" ? 401 : err.status;
    next(err);
  }
};
