const mongoose = require("mongoose");

const consentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },

    type: { type: String, enum: ["qr", "otp", "request", "grant"], required: true },

    status: {
      type: String,
      enum: ["pending", "active", "revoked", "expired"],
      default: "active"
    },

    tokenHash: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

consentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

consentSchema.index({ doctorId: 1, patientId: 1, type: 1, status: 1 });

module.exports = mongoose.model("Consent", consentSchema);
