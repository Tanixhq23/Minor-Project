import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    specialization: { type: String },
    passwordHash: { type: String },
    passwordSalt: { type: String },
    passwordIterations: { type: Number },
    passwordKeylen: { type: Number },
    passwordDigest: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
