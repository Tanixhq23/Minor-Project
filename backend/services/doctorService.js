const Jimp = require("jimp");
const QrReader = require("qrcode-reader");

const AccessLog = require("../models/AccessLog");
const AccessToken = require("../models/AccessToken");
const Document = require("../models/Document");
const MedicalHistory = require("../models/MedicalHistory");
const DownloadRequest = require("../models/DownloadRequest");
const DoctorHistory = require("../models/DoctorHistory");
const User = require("../models/User");

const AppError = require("../utils/AppError");
const { hashToken } = require("../utils/tokens");

async function consumeToken({ token, type, doctorId }) {
  return AccessToken.findOneAndUpdate(
    {
      tokenHash: hashToken(token),
      type,
      revokedAt: null,
      $or: [
        { usedAt: null },
        { doctorId: null }
      ],
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
  const token = tokenInput.includes("/")
    ? tokenInput.trim().split("/").pop()
    : tokenInput.trim();

  const access = await consumeToken({ token, type: "qr", doctorId });

  if (!access) {
    throw new AppError("Invalid or expired token", 400);
  }

  return await createAccessPayload(access);
}

async function accessWithOtp(otp, doctorId) {
  const access = await consumeToken({ token: otp, type: "otp", doctorId });

  if (!access) {
    throw new AppError("Invalid or expired OTP", 400);
  }

  return await createAccessPayload(access);
}

async function decodeQrFromBuffer(buffer) {
  try {
    const image = await Jimp.read(buffer);
    const qr = new QrReader();

    return await new Promise((resolve, reject) => {
      qr.callback = (error, value) => {
        if (error || !value) {
          reject(new Error("Unable to decode QR"));
          return;
        }
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

  const token = decoded.includes("/")
    ? decoded.trim().split("/").pop()
    : decoded.trim();

  const access = await consumeToken({ token, type: "qr", doctorId });

  if (!access) {
    throw new AppError("Invalid or expired token", 400);
  }

  return await createAccessPayload(access);
}

function calcAge(dob) {
  if (!dob) return null;

  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

async function getPatientProfile(patientId, doctorContext) {
  const patient = await User.findOne({
    _id: patientId,
    role: "patient",
  }).lean();

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  const history = await MedicalHistory.find({ patientId })
    .sort({ createdAt: -1 })
    .lean();

  await AccessLog.create({
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
  const query = { patientId };

  if (consent && consent.documentId) {
    query._id = consent.documentId;
  }

  const docs = await Document.find(query)
    .sort({ createdAt: -1 })
    .lean();
  const requests = await DownloadRequest.find({
    doctorId: doctorContext.id,
    patientId: patientId
  }).lean();

  const requestMap = requests.reduce((acc, req) => {
    acc[req.documentId.toString()] = req.status;
    return acc;
  }, {});

  await AccessLog.create({
    patientId,
    doctorId: doctorContext.id,
    action: "LIST_DOCS",
    ip: doctorContext.ip,
    userAgent: doctorContext.userAgent,
  });

  return docs.map((doc) => ({
    id: doc._id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    fileUrl: `${process.env.APP_BASE_URL}/api/doctor/patient/${patientId}/documents/stream/${doc._id}`,
    createdAt: doc.createdAt,
    approvalStatus: requestMap[doc._id.toString()] || "none"
  }));
}

async function requestDownload(doctorId, patientId, documentId) {
  const existing = await DownloadRequest.findOne({ doctorId, patientId, documentId });
  if (existing) {
    return existing;
  }

  return DownloadRequest.create({
    doctorId,
    patientId,
    documentId,
    status: "pending"
  });
}

async function getDocumentFromToken(tokenInput, doctorId) {
  const token = tokenInput.includes("/")
    ? tokenInput.trim().split("/").pop()
    : tokenInput.trim();

  const access = await consumeToken({
    token,
    type: "qr",
    doctorId
  });

  if (!access) {
    throw new AppError("Invalid or expired token", 400);
  }

  // If it was a specific document access, find it
  if (access.documentId) {
    const doc = await Document.findOne({
      _id: access.documentId,
      patientId: access.patientId
    });
    if (doc) return { type: "document", doc, patientId: access.patientId };
  }

  // Otherwise, it was blanket access
  return { type: "patient", patientId: access.patientId };
}

async function getHistory(doctorId) {
  const history = await DoctorHistory.find({
    doctorId,
    expiresAt: { $gt: new Date() }
  })
    .populate("patientId", "name gender dob")
    .sort({ updatedAt: -1 })
    .lean();

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