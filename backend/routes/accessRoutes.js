const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const AccessToken = require("../models/AccessToken");
const Document = require("../models/Document");
const AccessLog = require("../models/AccessLog");
const AppError = require("../utils/AppError");
const { hashToken } = require("../utils/tokens");

router.get("/:token", asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenHash = hashToken(token);

  const accessRecord = await AccessToken.findOne({
    tokenHash,
    type: "qr",
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!accessRecord) {
    throw new AppError("This QR code is invalid, expired, or has been revoked.", 404);
  }
  let doc;
  if (accessRecord.documentId) {
    doc = await Document.findOne({ _id: accessRecord.documentId, patientId: accessRecord.patientId }).lean();
  } else {
    return res.status(200).json({
      success: true,
      message: "Blanket access QR — please use the doctor dashboard to view all documents.",
      data: { patientId: accessRecord.patientId },
    });
  }

  if (!doc) {
    throw new AppError("Document not found or has been deleted.", 404);
  }
  await AccessToken.findByIdAndUpdate(accessRecord._id, { $set: { usedAt: new Date() } });

  await AccessLog.create({
    patientId: accessRecord.patientId,
    doctorId: accessRecord.doctorId || accessRecord.patientId,
    documentId: doc._id,
    action: "STREAM_DOC",
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "",
  });

  // Use the proxy to stream the file instead of redirecting
  const { streamLocalFile } = require("../utils/localFileStream");
  return await streamLocalFile(doc.storagePath, doc.mimeType, res);
}));

module.exports = router;
