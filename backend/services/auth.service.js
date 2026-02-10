import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const invalidRoleError = () => {
  const err = new Error("Role must be patient or doctor");
  err.status = 400;
  return err;
};

export const signup = async ({ role, name, email, password, specialization, phone }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const err = new Error("Email is required");
    err.status = 400;
    throw err;
  }
  if (!password) {
    const err = new Error("Password is required");
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
      name,
      email: normalizedEmail,
      phone,
      passwordHash: hash,
      passwordSalt: salt,
      passwordIterations: iterations,
      passwordKeylen: keylen,
      passwordDigest: digest,
    });
    return { user: patient, role };
  }

  if (role === "doctor") {
    const existing = await Doctor.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error("Doctor already exists");
      err.status = 409;
      throw err;
    }
    const doctor = await Doctor.create({
      name,
      email: normalizedEmail,
      specialization,
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
