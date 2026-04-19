const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/auth");

async function registerUser(payload) {
  const { role, name, email, password, gender, dob, specialty, licenseId } = payload;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    role,
    name,
    email: normalizedEmail,
    passwordHash,
    gender,
    dob,
    specialty: role === "doctor" ? specialty : "",
    licenseId: role === "doctor" ? licenseId : "",
  });

  return {
    token: signToken(user),
    user: { id: user._id, role: user.role, name: user.name },
  };
}

async function loginUser(payload) {
  const normalizedEmail = payload.email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
    throw new AppError("Invalid credentials", 401);
  }

  return {
    token: signToken(user),
    user: { id: user._id, role: user.role, name: user.name },
  };
}

function getCurrentUser(user) {
  return user;
}

async function updateUserProfile(userId, payload) {
  const { name, gender, dob, specialty, licenseId } = payload;
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (name) user.name = name;
  if (gender) user.gender = gender;
  if (dob) user.dob = dob;

  if (user.role === "doctor") {
    if (specialty) user.specialty = specialty;
    if (licenseId) user.licenseId = licenseId;
  }

  await user.save();
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
};
