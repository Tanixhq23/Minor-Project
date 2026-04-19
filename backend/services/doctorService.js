const mongoose = require("mongoose");
const Jimp = require("jimp");

const QrReader = require("qrcode-reader");
const Activity = require("../models/Activity");
const Consent = require("../models/Consent");
const Document = require("../models/Document");
const MedicalSummary = require("../models/MedicalSummary");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { hashToken } = require("../utils/tokens");

function getBaseUrl() {
  return process.env.RENDER_EXTERNAL_URL || process.env.APP_BASE_URL || "http://localhost:5000";
}

async function consumeToken({ token, type, doctorId }) {
  return Consent.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      type,
      status: "active",
      revokedAt: null,
      $or: [{ usedAt: null }, { doctorId: null }],
      expiresAt: { $gt: new Date() },
    },
    { $set: { usedAt: new Date(), doctorId } },
    { new: true }
  );
}

async function createAccessPayload(access) {
  const patient = await User.findById(access.patientId).select("name").lean();
  return {
    patientId: access.patientId,
    patientName: patient?.name,
    expiresAt: access.expiresAt,
    durationMinutes: Math.round((access.expiresAt - access.usedAt) / 60000),
  };
}

async function accessWithQr(tokenInput, doctorId) {
  const token = tokenInput.includes("/") ? tokenInput.trim().split("/").pop() : tokenInput.trim();
  const access = await consumeToken({ token, type: "qr", doctorId });
  if (!access) throw new AppError("Invalid or expired token", 400);
  return await createAccessPayload(access);
}

async function accessWithOtp(otp, doctorId) {
  const access = await consumeToken({ token: otp, type: "otp", doctorId });
  if (!access) throw new AppError("Invalid or expired OTP", 400);
  return await createAccessPayload(access);
}

async function decodeQrFromBuffer(buffer) {
  try {
    const image = await Jimp.read(buffer);
    image.grayscale(); 
    const qr = new QrReader();
    return await new Promise((resolve, reject) => {
      qr.callback = (error, value) => {
        if (error || !value) return reject(new Error(error || "Unable to decode QR content"));
        resolve(value.result);
      };
      qr.decode(image.bitmap);
    });
  } catch (error) {
    throw new AppError("QR decode failed", 400);
  }
}

async function accessWithQrImage(file, doctorId) {
  const decoded = await decodeQrFromBuffer(file.buffer);
  const token = decoded.includes("/") ? decoded.trim().split("/").pop() : decoded.trim();
  const access = await consumeToken({ token, type: "qr", doctorId });
  if (!access) throw new AppError("Invalid or expired token", 400);
  return await createAccessPayload(access);
}

function calcAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

async function getPatientProfile(patientId, doctorContext) {
  const patient = await User.findOne({ _id: patientId, role: "patient" }).lean();
  if (!patient) throw new AppError("Patient not found", 404);

  const history = await MedicalSummary.find({ patientId }).sort({ createdAt: -1 }).lean();

  await Activity.create({
    patientId,
    doctorId: doctorContext.id,
    action: "VIEW_PROFILE",
    ip: doctorContext.ip,
    userAgent: doctorContext.userAgent,
  });

  return {
    profile: {
      id: patient._id,
      name: patient.name,
      age: calcAge(patient.dob),
      gender: patient.gender,
    },
    medicalHistory: history.map((item) => ({
      id: item._id,
      summary: item.summary,
      createdAt: item.createdAt,
    })),
  };
}

async function getPatientDocuments(patientId, doctorContext, consent) {
  // Use fuzzy ID matching: check both ObjectId and String formats
  const patientIdObj = mongoose.Types.ObjectId.isValid(patientId) ? new mongoose.Types.ObjectId(patientId) : null;
  
  const query = { 
    $or: [
      { patientId: patientIdObj },
      { patientId: patientId.toString() }
    ]
  };

  if (consent && consent.documentId) {
    const docId = consent.documentId.toString();
    const docIdObj = mongoose.Types.ObjectId.isValid(docId) ? new mongoose.Types.ObjectId(docId) : null;
    query.$and = [{
      $or: [
        { _id: docIdObj },
        { _id: docId }
      ]
    }];
  }

  console.log(`[DEBUG] ROBUST QUERY for patient: ${patientId}. Query:`, JSON.stringify(query));
  
  const docs = await Document.find(query).sort({ createdAt: -1 }).lean();
  console.log(`[DEBUG] SUCCESS: Found ${docs?.length || 0} documents for ${patientId}`);

  const requests = await Consent.find({


    doctorId: doctorContext.id,
    patientId,
    type: { $in: ["request", "grant"] }
  }).lean();

  const requestMap = requests.reduce((acc, req) => {
    acc[req.documentId?.toString() || "blanket"] = req.status;
    return acc;
  }, {});

  await Activity.create({
    patientId,
    doctorId: doctorContext.id,
    action: "LIST_DOCS",
    ip: doctorContext.ip,
    userAgent: doctorContext.userAgent,
  });

  return docs.map((doc) => {
    const status = requestMap[doc._id.toString()] || "none";
    return {
      id: doc._id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      fileUrl: `${getBaseUrl()}/api/doctor/patient/${patientId}/documents/stream/${doc._id}`,
      createdAt: doc.createdAt,
      approvalStatus: status === "active" ? "approved" : status,
    };
  });
}

async function requestDownload(doctorId, patientId, documentId) {
  const existing = await Consent.findOne({ doctorId, patientId, documentId, type: "request" });
  if (existing) return existing;

  return Consent.create({
    doctorId,
    patientId,
    documentId,
    type: "request",
    status: "pending",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
}

async function getDocumentFromToken(tokenInput, doctorId) {
  const token = tokenInput.includes("/") ? tokenInput.trim().split("/").pop() : tokenInput.trim();
  const access = await consumeToken({ token, type: "qr", doctorId });
  if (!access) throw new AppError("Invalid or expired token", 400);

  if (access.documentId) {
    const doc = await Document.findOne({ _id: access.documentId, patientId: access.patientId });
    if (doc) return { type: "document", doc, patientId: access.patientId };
  }

  return { type: "patient", patientId: access.patientId };
}

async function getHistory(doctorId) {
  const history = await Consent.find({
    doctorId,
    type: "grant",
    status: "active",
    expiresAt: { $gt: new Date() }
  }).populate("patientId", "name gender dob").sort({ updatedAt: -1 }).lean();

  return history.map((h) => ({
    patientId: h.patientId?._id,
    name: h.patientId?.name,
    gender: h.patientId?.gender,
    age: calcAge(h.patientId?.dob),
    expiresAt: h.expiresAt
  }));
}

module.exports = {
  accessWithQr,
  accessWithOtp,
  accessWithQrImage,
  getPatientProfile,
  getPatientDocuments,
  getDocumentFromToken,
  requestDownload,
  getHistory
};