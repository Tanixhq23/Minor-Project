const mongoose = require("mongoose");

const downloadRequestSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Add compound index for fast lookups by doctor/patient/document
downloadRequestSchema.index({ doctorId: 1, patientId: 1, documentId: 1 });

module.exports = mongoose.model("DownloadRequest", downloadRequestSchema);
