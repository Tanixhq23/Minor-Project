import * as patientService from "../services/patient.service.js";
import { createToken } from "../utils/token.js";
import { generateQRCodeDataUrl } from "../utils/qrcode.js";
import { sendQrGeneratedEmail } from "../services/notification.js";
import AppError from "../utils/AppError.js";
import { analyzeHealthReportPdf } from "../utils/reportAnalyzer.js";

export const uploadHistory = async (req, res) => {
  const { doctorEmail } = req.body;
  const medicalData = req.medicalData;

  const patient = await patientService.getPatientById(req.user.id);
  if (!patient) {
    throw new AppError(404, "Patient not found", "PATIENT_NOT_FOUND");
  }

  const record = await patientService.saveRecord({ patient, medicalData });

  const token = createToken({ sub: record._id, scope: "record:read" }, "10m");
  const baseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
  const accessUrl = `${baseUrl}/doctor?id=${record._id}&token=${token}`;
  const qrCode = await generateQRCodeDataUrl(accessUrl);

  record.accessUrl = accessUrl;
  await record.save();

  sendQrGeneratedEmail({
    email: patient?.email,
    name: patient?.name,
    recordId: record._id,
    accessUrl,
    recipientRole: "patient",
  }).catch(() => {});

  if (doctorEmail) {
    sendQrGeneratedEmail({
      email: doctorEmail,
      name: "Doctor",
      recordId: record._id,
      accessUrl,
      recipientRole: "doctor",
    }).catch(() => {});
  }

  return res.status(201).json({
    success: true,
    data: {
      recordId: record._id,
      accessUrl,
      qrCodeDataUrl: qrCode,
      tokenExpiresIn: "10m",
    },
  });
};

export const getPatientRecords = async (req, res) => {
  const records = await patientService.getRecordsByPatientId(req.user.id);
  return res.json({ success: true, data: records });
};

export const generateQrForExistingRecord = async (req, res) => {
  const { id } = req.params;
  const record = await patientService.getRecordByIdForPatient(id, req.user.id);
  if (!record) {
    throw new AppError(404, "Record not found", "RECORD_NOT_FOUND");
  }

  const token = createToken({ sub: record._id, scope: "record:read" }, "10m");
  const baseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
  const accessUrl = `${baseUrl}/doctor?id=${record._id}&token=${token}`;
  const qrCode = await generateQRCodeDataUrl(accessUrl);

  record.accessUrl = accessUrl;
  await record.save();

  return res.json({
    success: true,
    data: {
      recordId: record._id,
      accessUrl,
      qrCodeDataUrl: qrCode,
      tokenExpiresIn: "10m",
    },
  });
};

export const deletePatientRecord = async (req, res) => {
  const { id } = req.params;
  const deleted = await patientService.deleteRecordByIdForPatient(id, req.user.id);
  if (!deleted) {
    throw new AppError(404, "Record not found", "RECORD_NOT_FOUND");
  }

  return res.json({
    success: true,
    data: { recordId: id, deleted: true },
  });
};

export const analyzePatientReport = async (req, res) => {
  const medicalData = req.medicalData;
  const patient = await patientService.getPatientById(req.user.id);
  if (!patient) {
    throw new AppError(404, "Patient not found", "PATIENT_NOT_FOUND");
  }

  const analysis = analyzeHealthReportPdf(medicalData.file);
  const updated = await patientService.updatePatientHealthProfile(
    req.user.id,
    analysis.metrics,
    medicalData.fileName
  );
  if (!updated) {
    throw new AppError(404, "Patient not found", "PATIENT_NOT_FOUND");
  }

  return res.json({
    success: true,
    data: {
      extractedText: analysis.extractedText,
      reportTypes: analysis.reportTypes,
      metrics: analysis.metrics,
      findings: analysis.findings,
      healthProfile: updated.healthProfile || {},
      analyzedAt: updated.healthProfile?.lastAnalyzedAt || new Date(),
    },
  });
};
