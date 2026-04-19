const doctorService = require("../services/doctorService");
const Document = require("../models/Document");
const Activity = require("../models/Activity");
const Consent = require("../models/Consent");
const sendResponse = require("../utils/apiResponse");
const AppError = require("../utils/AppError");
const { streamLocalFile } = require("../utils/localFileStream");

async function streamDocument(req, res) {
  const { patientId, documentId } = req.params;
  const doc = await Document.findOne({ _id: documentId, patientId });

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  // Check for download approval in the unified Consent model
  if (req.query.download === "true") {
    const approval = await Consent.findOne({
      doctorId: req.user.id,
      patientId: patientId,
      documentId: documentId,
      type: "grant",
      status: "active"
    });

    if (!approval) {
      throw new AppError("Access Denied: Patient has not approved this download request.", 403);
    }
  }

  await Activity.create({
    patientId,
    doctorId: req.user.id,
    documentId: doc._id,
    action: "STREAM_DOC",
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });

  await streamLocalFile(doc.storagePath, doc.mimeType, res);
}

async function requestDownload(req, res) {
  const { patientId, documentId } = req.params;
  const data = await doctorService.requestDownload(req.user.id, patientId, documentId);
  return sendResponse(res, { message: "Download request sent to patient", data });
}

function getDoctorContext(req) {
  return {
    id: req.user.id,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
  };
}

async function accessWithQr(req, res) {
  const { token } = req.body;
  const result = await doctorService.getDocumentFromToken(token, req.user.id);
  return sendResponse(res, { message: "QR access granted", data: result });
}

async function accessWithOtp(req, res) {
  const data = await doctorService.accessWithOtp(req.body.otp, req.user.id);
  return sendResponse(res, { message: "OTP access granted", data });
}

async function accessWithQrImage(req, res) {
  const data = await doctorService.accessWithQrImage(req.file, req.user.id);
  return sendResponse(res, { message: "QR image access granted", data });
}

async function getPatientProfile(req, res) {
  const data = await doctorService.getPatientProfile(req.params.patientId, getDoctorContext(req));
  return sendResponse(res, { message: "Patient profile fetched successfully", data });
}

async function getPatientDocuments(req, res) {
  const documents = await doctorService.getPatientDocuments(req.params.patientId, getDoctorContext(req), req.consent);
  return sendResponse(res, { message: "Patient documents fetched successfully", data: { documents } });
}

async function getHistory(req, res) {
  const data = await doctorService.getHistory(req.user.id);
  return sendResponse(res, { message: "Patient access history fetched", data: { history: data } });
}

module.exports = {
  accessWithQr,
  accessWithOtp,
  accessWithQrImage,
  getPatientProfile,
  getPatientDocuments,
  streamDocument,
  requestDownload,
  getHistory,
};
