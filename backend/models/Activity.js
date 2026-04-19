const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
    action: { type: String, enum: ["VIEW_PROFILE", "LIST_DOCS", "STREAM_DOC"], required: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

module.exports = mongoose.model("Activity", activitySchema);
