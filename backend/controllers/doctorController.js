const mongoose = require("mongoose");
const doctorService = require("../services/doctorService");
const Document = require("../models/Document");
const Activity = require("../models/Activity");
const Consent = require("../models/Consent");
const sendResponse = require("../utils/apiResponse");
const AppError = require("../utils/AppError");
const { streamLocalFile } = require("../utils/localFileStream");

async function streamDocument(req, res) {
  const { patientId, documentId } = req.params;
  
  const doc = await Document.findOne({ 
    _id: new mongoose.Types.ObjectId(documentId), 
    patientId: new mongoose.Types.ObjectId(patientId) 
  });

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  // Check for download approval IF the download query param is present
  if (req.query.download === "true") {
    const approval = await Consent.findOne({
      doctorId: new mongoose.Types.ObjectId(req.user.id),
      patientId: new mongoose.Types.ObjectId(patientId),
      documentId: new mongoose.Types.ObjectId(documentId),
      type: "grant",
      status: "active"
    });

    if (!approval) {
      throw new AppError("Access Denied: Patient has not approved this download request.", 403);
    }
  }

  // Log activity
  await Activity.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(req.user.id),
    documentId: doc._id,
    action: req.query.download === "true" ? "DOWNLOAD_DOC" : "VIEW_DOC",
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
  const result = await doctorService.accessWithQr(token, req.user.id);
  const message = result.type === "document" ? "Document access granted" : "Patient profiles access granted";
  return sendResponse(res, { message, data: result });
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
