import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String },
    passwordHash: { type: String },
    passwordSalt: { type: String },
    passwordIterations: { type: Number },
    passwordKeylen: { type: Number },
    passwordDigest: { type: String },
    healthProfile: {
      hemoglobin: { type: Number },
      glucose: { type: Number },
      cholesterol: { type: Number },
      bmi: { type: Number },
      heartRate: { type: Number },
      bloodPressureSystolic: { type: Number },
      bloodPressureDiastolic: { type: Number },
      lastAnalyzedAt: { type: Date },
      lastReportName: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);
