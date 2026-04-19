const mongoose = require("mongoose");

const accessTokenSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
    type: { type: String, enum: ["qr", "otp"], required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

accessTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AccessToken", accessTokenSchema);
