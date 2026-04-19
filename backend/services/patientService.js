const path = require("path");
const qrcode = require("qrcode");
const Document = require("../models/Document");
const AccessToken = require("../models/AccessToken");
const AccessLog = require("../models/AccessLog");
const DownloadRequest = require("../models/DownloadRequest");
const DoctorHistory = require("../models/DoctorHistory");
const AppError = require("../utils/AppError");
const { generateOtp, generateToken, hashToken } = require("../utils/tokens");
const env = require("../config/env");

function toLogSummary(log) {
  return {
    id: log._id,
    action: log.action,
    doctorName: log.doctorId ? log.doctorId.name : "Someone (via QR)",
    documentName: log.documentId ? log.documentId.originalName : null,
    ip: log.ip,
    userAgent: log.userAgent,
    timestamp: log.timestamp,
  };
}


function toDocumentSummary(doc) {
  return {
    id: doc._id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    fileUrl: `${env.appBaseUrl}/api/patient/documents/stream/${doc._id}`,
    createdAt: doc.createdAt,
  };
}

function toAccessSummary(token) {
  return {
    _id: token._id,
    type: token.type,
    expiresAt: token.expiresAt,
    usedAt: token.usedAt,
    createdAt: token.createdAt,
    documentId: token.documentId || null,
    doctor: token.doctorId
      ? { id: token.doctorId._id, name: token.doctorId.name }
      : null,
  };
}

async function uploadDocument(userId, file) {
  // Multer diskStorage has already saved the file by now
  // file.path contains the relative or absolute path depending on configuration
  const relativePath = path.relative(process.cwd(), file.path);

  const doc = await Document.create({
    patientId: userId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    fileUrl: `${env.appBaseUrl}/api/patient/documents/stream/TEMPID`, // Fixed in next step or via ID
    storagePath: relativePath,
  });

  // Update fileUrl with the real ID
  doc.fileUrl = `${env.appBaseUrl}/api/patient/documents/stream/${doc._id}`;
  await doc.save();

  return toDocumentSummary(doc);
}

async function listDocuments(userId) {
  const documents = await Document.find({ patientId: userId }).sort({ createdAt: -1 }).lean();
  return documents.map(toDocumentSummary);
}

async function createQrAccess(userId, documentId = null) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + env.tokenTtlMin * 60 * 1000);

  const accessUrl = `${env.appBaseUrl}/api/access/${token}`;

  await AccessToken.create({
    patientId: userId,
    documentId: documentId || null,
    type: "qr",
    tokenHash: hashToken(token),
    expiresAt,
  });
  const qrDataUrl = await qrcode.toDataURL(accessUrl, { errorCorrectionLevel: "M", width: 300 });

  return {
    qrDataUrl,
    accessUrl,
    expiresAt,
    durationMinutes: env.tokenTtlMin,
  };
}

async function createOtpAccess(userId) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + env.otpTtlMin * 60 * 1000);

  await AccessToken.create({
    patientId: userId,
    type: "otp",
    tokenHash: hashToken(otp),
    expiresAt,
  });

  return {
    otp,
    expiresAt,
    durationMinutes: env.otpTtlMin,
  };
}

async function listActiveAccess(userId) {
  const tokens = await AccessToken.find({
    patientId: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .populate("doctorId", "name")
    .lean();
  return tokens.map(toAccessSummary);
}

async function revokeAccess(userId, consentId) {
  const token = await AccessToken.findOne({ _id: consentId, patientId: userId });
  if (!token) throw new AppError("Consent not found", 404);
  token.revokedAt = new Date();
  await token.save();
  return { success: true };
}

async function deleteDocument(userId, docId) {
  const doc = await Document.findOne({ _id: docId, patientId: userId });
  if (!doc) throw new AppError("Document not found", 404);

  // 1. Delete physical file
  const absolutePath = path.isAbsolute(doc.storagePath)
    ? doc.storagePath
    : path.join(process.cwd(), doc.storagePath);

  if (require("fs").existsSync(absolutePath)) {
    require("fs").unlinkSync(absolutePath);
  }

  // 2. Delete DB record
  await Document.deleteOne({ _id: docId });

  return { success: true };
}

async function listLogs(userId, limit = 100) {
  const logs = await AccessLog.find({ patientId: userId })
    .populate("doctorId", "name")
    .populate("documentId", "originalName")
    .sort({ timestamp: -1 })
    .limit(parseInt(limit) || 100)
    .lean();

  return logs.map(toLogSummary);
}

async function getDownloadRequests(patientId) {
  return DownloadRequest.find({ patientId, status: "pending" })
    .populate("doctorId", "name")
    .populate("documentId", "originalName")
    .sort({ createdAt: -1 })
    .lean();
}

async function respondToRequest(patientId, requestId, status) {
  const request = await DownloadRequest.findOne({ _id: requestId, patientId });
  if (!request) throw new AppError("Request not found", 404);

  request.status = status;
  request.respondedAt = new Date();
  await request.save();

  // If approved, add/update 3-day history for this doctor
  if (status === "approved") {
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await DoctorHistory.findOneAndUpdate(
      { doctorId: request.doctorId, patientId: request.patientId },
      { $set: { expiresAt } },
      { upsert: true }
    );
  }

  return request;
}

module.exports = {
  uploadDocument,
  listDocuments,
  createQrAccess,
  createOtpAccess,
  listActiveAccess,
  revokeAccess,
  deleteDocument,
  listLogs,
  getDownloadRequests,
  respondToRequest
};
