const path = require("path");
const qrcode = require("qrcode");
const mongoose = require("mongoose");
const Document = require("../models/Document");
const Consent = require("../models/Consent");
const Activity = require("../models/Activity");
const AppError = require("../utils/AppError");
const { generateOtp, generateToken, hashToken } = require("../utils/tokens");
const { getBucket } = require("../config/gridfs");
const { Readable } = require("stream");

function getBaseUrl() {
  return process.env.RENDER_EXTERNAL_URL || process.env.APP_BASE_URL || "http://localhost:5000";
}

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
    fileUrl: `${getBaseUrl()}/api/patient/documents/stream/${doc._id}`,
    createdAt: doc.createdAt,
  };
}

function toAccessSummary(consent) {
  return {
    _id: consent._id,
    type: consent.type,
    expiresAt: consent.expiresAt,
    usedAt: consent.usedAt,
    createdAt: consent.createdAt,
    documentId: consent.documentId || null,
    doctor: consent.doctorId
      ? { id: consent.doctorId._id, name: consent.doctorId.name }
      : null,
  };
}

async function uploadDocument(userId, file) {
  try {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: { patientId: userId }
    });

    const fileId = uploadStream.id;
    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    await new Promise((resolve, reject) => {
      readableStream.pipe(uploadStream).on("error", reject).on("finish", resolve);
    });

    const doc = await Document.create({
      patientId: userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      fileUrl: `${getBaseUrl()}/api/patient/documents/stream/TEMPID`,
      storagePath: `gridfs:${fileId}`,
    });

    doc.fileUrl = `${getBaseUrl()}/api/patient/documents/stream/${doc._id}`;
    await doc.save();
    return toDocumentSummary(doc);
  } catch (error) {
    throw new AppError("Failed to store document", 500);
  }
}

async function listDocuments(userId) {
  const documents = await Document.find({ patientId: userId }).sort({ createdAt: -1 }).lean();
  return documents.map(toDocumentSummary);
}

async function createQrAccess(userId, documentId = null) {
  const token = generateToken();
  const ttl = Number(process.env.TOKEN_TTL_MIN || 15);
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
  const accessUrl = `${getBaseUrl()}/api/access/${token}`;

  await Consent.create({
    patientId: userId,
    documentId: documentId || null,
    type: "qr",
    tokenHash: hashToken(token),
    expiresAt,
  });

  const qrDataUrl = await qrcode.toDataURL(accessUrl, { width: 300 });
  return { qrDataUrl, accessUrl, expiresAt, durationMinutes: ttl };
}

async function createOtpAccess(userId) {
  const otp = generateOtp();
  const ttl = Number(process.env.OTP_TTL_MIN || 8);
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

  await Consent.create({
    patientId: userId,
    type: "otp",
    tokenHash: hashToken(otp),
    expiresAt,
  });

  return { otp, expiresAt, durationMinutes: ttl };
}

async function listActiveAccess(userId) {
  const consents = await Consent.find({
    patientId: userId,
    status: "active",
    type: { $in: ["qr", "otp", "grant"] },
    expiresAt: { $gt: new Date() },
  }).populate("doctorId", "name").lean();
  
  return consents.map(toAccessSummary);
}

async function revokeAccess(userId, consentId) {
  const consent = await Consent.findOne({ _id: consentId, patientId: userId });
  if (!consent) throw new AppError("Consent not found", 404);
  consent.status = "revoked";
  await consent.save();
  return { success: true };
}

async function deleteDocument(userId, docId) {
  const doc = await Document.findOne({ _id: docId, patientId: userId });
  if (!doc) throw new AppError("Document not found", 404);

  if (doc.storagePath.startsWith("gridfs:")) {
    const bucket = getBucket();
    const fileId = doc.storagePath.split(":")[1];
    try { await bucket.delete(new mongoose.Types.ObjectId(fileId)); } catch (e) {}
  } else if (!doc.storagePath.startsWith("http")) {
    const absPath = path.isAbsolute(doc.storagePath) ? doc.storagePath : path.join(process.cwd(), doc.storagePath);
    if (require("fs").existsSync(absPath)) require("fs").unlinkSync(absPath);
  }

  await Document.deleteOne({ _id: docId });
  return { success: true };
}

async function listLogs(userId, limit = 100) {
  const logs = await Activity.find({ patientId: userId })
    .populate("doctorId", "name")
    .populate("documentId", "originalName")
    .sort({ timestamp: -1 })
    .limit(parseInt(limit) || 100).lean();
  return logs.map(toLogSummary);
}

async function getDownloadRequests(patientId) {
  return Consent.find({ patientId, status: "pending", type: "request" })
    .populate("doctorId", "name")
    .populate("documentId", "originalName")
    .sort({ createdAt: -1 }).lean();
}

async function respondToRequest(patientId, requestId, status) {
  const request = await Consent.findOne({ _id: requestId, patientId, type: "request" });
  if (!request) throw new AppError("Request not found", 404);

  if (status === "approved") {
    request.status = "active";
    request.type = "grant";
    request.expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  } else {
    request.status = "revoked";
  }
  
  request.respondedAt = new Date();
  await request.save();
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
