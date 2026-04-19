const mongoose = require("mongoose");

const doctorHistorySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Compound index for fast lookup and automatic expiration
doctorHistorySchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
doctorHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("DoctorHistory", doctorHistorySchema);
