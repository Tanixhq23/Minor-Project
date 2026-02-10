import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, index: true },
    phone: { type: String },
    passwordHash: { type: String },
    passwordSalt: { type: String },
    passwordIterations: { type: Number },
    passwordKeylen: { type: Number },
    passwordDigest: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
