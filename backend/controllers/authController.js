const authService = require("../services/authService");
const sendResponse = require("../utils/apiResponse");

function setAuthCookie(res, token) {
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  res.cookie("token", token, cookieOptions);
}

async function register(req, res) {
  const data = await authService.registerUser(req.body);
  setAuthCookie(res, data.token);
  return sendResponse(res, { message: "Registration successful", data });
}

async function login(req, res) {
  const data = await authService.loginUser(req.body);
  setAuthCookie(res, data.token);
  return sendResponse(res, { message: "Login successful", data });
}

async function me(req, res) {
  const data = authService.getCurrentUser(req.user);
  return sendResponse(res, { message: "Current user fetched", data: { user: data } });
}

async function updateProfile(req, res) {
  const data = await authService.updateUserProfile(req.user.id, req.body);
  return sendResponse(res, { message: "Profile updated successfully", data: { user: data } });
}

async function logout(req, res) {
  res.clearCookie("token");
  return sendResponse(res, { message: "Logged out successfully" });
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  logout,
};
