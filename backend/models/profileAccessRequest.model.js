import mongoose from "mongoose";

const profileAccessRequestSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
    record: { type: mongoose.Schema.Types.ObjectId, ref: "Record", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("ProfileAccessRequest", profileAccessRequestSchema);
