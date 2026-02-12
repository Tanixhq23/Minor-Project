import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const invalidRoleError = () => {
  const err = new Error("Role must be patient or doctor");
  err.status = 400;
  return err;
};

const getUserModelForRole = (role) => {
  if (role === "patient") return Patient;
  if (role === "doctor") return Doctor;
  throw invalidRoleError();
};

const toProfileResponse = (user, role) => ({
  id: user._id,
  role,
  name: user.name || "",
  email: user.email || "",
  ...(role === "patient"
    ? {
        phone: user.phone || "",
        healthProfile: {
          hemoglobin: user.healthProfile?.hemoglobin ?? null,
          glucose: user.healthProfile?.glucose ?? null,
          cholesterol: user.healthProfile?.cholesterol ?? null,
          bmi: user.healthProfile?.bmi ?? null,
          heartRate: user.healthProfile?.heartRate ?? null,
          bloodPressureSystolic: user.healthProfile?.bloodPressureSystolic ?? null,
          bloodPressureDiastolic: user.healthProfile?.bloodPressureDiastolic ?? null,
          lastAnalyzedAt: user.healthProfile?.lastAnalyzedAt ?? null,
          lastReportName: user.healthProfile?.lastReportName ?? "",
        },
      }
    : {}),
  ...(role === "doctor" ? { specialization: user.specialization || "" } : {}),
});

export const signup = async ({ role, name, email, password, specialization, phone }) => {
  const normalizedName = (name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = (phone || "").trim();
  const normalizedSpecialization = (specialization || "").trim();

  if (!normalizedName) {
    const err = new Error("Name is required");
    err.status = 400;
    throw err;
  }
  if (!normalizedEmail) {
    const err = new Error("Email is required");
    err.status = 400;
    throw err;
  }
  if (!isValidEmail(normalizedEmail)) {
    const err = new Error("Invalid email format");
    err.status = 400;
    throw err;
  }
  if (!password) {
    const err = new Error("Password is required");
    err.status = 400;
    throw err;
  }
  if (password.length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.status = 400;
    throw err;
  }

  const { salt, hash, iterations, keylen, digest } = hashPassword(password);

  if (role === "patient") {
    const existing = await Patient.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error("Patient already exists");
      err.status = 409;
      throw err;
    }
    const patient = await Patient.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone || undefined,
      passwordHash: hash,
      passwordSalt: salt,
      passwordIterations: iterations,
      passwordKeylen: keylen,
      passwordDigest: digest,
    });
    return { user: patient, role };
  }

  if (role === "doctor") {
    if (!normalizedSpecialization) {
      const err = new Error("Specialization is required for doctor signup");
      err.status = 400;
      throw err;
    }
    const existing = await Doctor.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error("Doctor already exists");
      err.status = 409;
      throw err;
    }
    const doctor = await Doctor.create({
      name: normalizedName,
      email: normalizedEmail,
      specialization: normalizedSpecialization,
      passwordHash: hash,
      passwordSalt: salt,
      passwordIterations: iterations,
      passwordKeylen: keylen,
      passwordDigest: digest,
    });
    return { user: doctor, role };
  }

  throw invalidRoleError();
};

export const signin = async ({ role, email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    const err = new Error("Email and password are required");
    err.status = 400;
    throw err;
  }

  if (role === "patient") {
    const patient = await Patient.findOne({ email: normalizedEmail });
    if (!patient || !patient.passwordHash) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    const valid = verifyPassword(password, {
      salt: patient.passwordSalt,
      hash: patient.passwordHash,
      iterations: patient.passwordIterations,
      keylen: patient.passwordKeylen,
      digest: patient.passwordDigest,
    });
    if (!valid) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    return { user: patient, role };
  }

  if (role === "doctor") {
    const doctor = await Doctor.findOne({ email: normalizedEmail });
    if (!doctor || !doctor.passwordHash) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    const valid = verifyPassword(password, {
      salt: doctor.passwordSalt,
      hash: doctor.passwordHash,
      iterations: doctor.passwordIterations,
      keylen: doctor.passwordKeylen,
      digest: doctor.passwordDigest,
    });
    if (!valid) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      throw err;
    }
    return { user: doctor, role };
  }

  throw invalidRoleError();
};

export const getProfile = async ({ userId, role }) => {
  const Model = getUserModelForRole(role);
  const user = await Model.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return toProfileResponse(user, role);
};

export const updateProfile = async ({
  userId,
  role,
  name,
  email,
  phone,
  specialization,
  currentPassword,
  newPassword,
}) => {
  const Model = getUserModelForRole(role);
  const user = await Model.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const normalizedName = (name || "").trim();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedName) {
    const err = new Error("Name is required");
    err.status = 400;
    throw err;
  }
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    const err = new Error("Valid email is required");
    err.status = 400;
    throw err;
  }

  const emailOwner = await Model.findOne({ email: normalizedEmail });
  if (emailOwner && String(emailOwner._id) !== String(user._id)) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  user.name = normalizedName;
  user.email = normalizedEmail;

  if (role === "patient") {
    user.phone = (phone || "").trim();
  }

  if (role === "doctor") {
    const normalizedSpecialization = (specialization || "").trim();
    if (!normalizedSpecialization) {
      const err = new Error("Specialization is required");
      err.status = 400;
      throw err;
    }
    user.specialization = normalizedSpecialization;
  }

  if (newPassword) {
    if (String(newPassword).length < 8) {
      const err = new Error("New password must be at least 8 characters");
      err.status = 400;
      throw err;
    }
    const valid = verifyPassword(currentPassword, {
      salt: user.passwordSalt,
      hash: user.passwordHash,
      iterations: user.passwordIterations,
      keylen: user.passwordKeylen,
      digest: user.passwordDigest,
    });
    if (!valid) {
      const err = new Error("Current password is incorrect");
      err.status = 401;
      throw err;
    }
    const { salt, hash, iterations, keylen, digest } = hashPassword(String(newPassword));
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.passwordIterations = iterations;
    user.passwordKeylen = keylen;
    user.passwordDigest = digest;
  }

  await user.save();
  return toProfileResponse(user, role);
};
