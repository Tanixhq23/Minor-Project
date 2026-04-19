const mongoose = require("mongoose");

const medicalSummarySchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    summary: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalSummary", medicalSummarySchema);
