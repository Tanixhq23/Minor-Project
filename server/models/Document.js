const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    storagePath: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
