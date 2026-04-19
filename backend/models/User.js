const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["patient", "doctor"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    dob: { type: Date },
    specialty: { type: String, default: "" },
    licenseId: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
