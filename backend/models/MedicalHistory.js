const mongoose = require("mongoose");

const medicalHistorySchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summary: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalHistory", medicalHistorySchema);
