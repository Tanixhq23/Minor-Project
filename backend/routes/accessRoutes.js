const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const Consent = require("../models/Consent");
const Document = require("../models/Document");
const Activity = require("../models/Activity");
const AppError = require("../utils/AppError");
const { hashToken } = require("../utils/tokens");
const { streamLocalFile } = require("../utils/localFileStream");

router.get("/:token", asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenHash = hashToken(token);

  const consent = await Consent.findOne({
    tokenHash,
    type: "qr",
    status: "active",
    expiresAt: { $gt: new Date() },
  });

  if (!consent) {
    throw new AppError("This QR code is invalid, expired, or has been revoked.", 404);
  }

  let doc;
  if (consent.documentId) {
    doc = await Document.findOne({ _id: consent.documentId, patientId: consent.patientId }).lean();
  } else {
    // Blanket access
    return res.status(200).json({
      success: true,
      message: "Access granted — please use the professional dashboard to view records.",
      data: { patientId: consent.patientId },
    });
  }

  if (!doc) {
    throw new AppError("Document not found.", 404);
  }

  // Log usage
  consent.usedAt = new Date();
  await consent.save();

  await Activity.create({
    patientId: consent.patientId,
    doctorId: consent.doctorId || consent.patientId, // Self-access if scanned by user
    documentId: doc._id,
    action: "STREAM_DOC",
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });

  return await streamLocalFile(doc.storagePath, doc.mimeType, res);
}));

module.exports = router;
