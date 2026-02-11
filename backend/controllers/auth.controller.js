import * as authService from "../services/auth.service.js";
import { createToken, verifyToken } from "../utils/token.js";
import { sendLoginEmail, sendSignupEmail } from "../services/notification.js";
import AppError from "../utils/AppError.js";

const redirectForRole = (role) => (role === "doctor" ? "/doctor" : "/patient");

const TOKEN_COOKIE = "auth_token";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = (rememberMe) => ({
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  ...(rememberMe ? { maxAge: THIRTY_DAYS_MS } : {}),
});

const setAuthCookie = (res, token, rememberMe) => {
  res.cookie(TOKEN_COOKIE, token, cookieOptions(rememberMe));
};

const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE, cookieOptions(false));
};

export const signup = async (req, res) => {
  const { role, name, email, password, specialization, phone } = req.body;
  const { user } = await authService.signup({
    role,
    name,
    email,
    password,
    specialization,
    phone,
  });

  const token = createToken({ sub: user._id, role, scope: "auth" }, "30d");
  setAuthCookie(res, token, false);

  sendSignupEmail({ email: user.email, name: user.name, role }).catch(() => {});

  return res.status(201).json({
    success: true,
    data: {
      role,
      redirectUrl: redirectForRole(role),
      user: { id: user._id, name: user.name, email: user.email },
    },
  });
};

export const signin = async (req, res) => {
  const { role, email, password, rememberMe } = req.body;
  const { user } = await authService.signin({ role, email, password });

  const token = createToken({ sub: user._id, role, scope: "auth" }, "30d");
  setAuthCookie(res, token, Boolean(rememberMe));

  sendLoginEmail({ email: user.email, name: user.name, role }).catch(() => {});

  return res.json({
    success: true,
    data: {
      role,
      redirectUrl: redirectForRole(role),
      user: { id: user._id, name: user.name, email: user.email },
    },
  });
};

export const session = async (req, res) => {
  const token = req.cookies?.[TOKEN_COOKIE] || null;
  if (!token) {
    throw new AppError(401, "Not authenticated", "AUTH_REQUIRED");
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new AppError(401, "Invalid session", "INVALID_SESSION");
  }

  return res.json({
    success: true,
    data: { userId: payload.sub, role: payload.role },
  });
};

export const logout = (_req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true });
};

export const me = async (req, res) => {
  if (!req.user?.id || !req.user?.role) {
    throw new AppError(401, "Unauthorized", "AUTH_REQUIRED");
  }

  const profile = await authService.getProfile({ userId: req.user.id, role: req.user.role });
  return res.json({ success: true, data: profile });
};

export const updateMe = async (req, res) => {
  if (!req.user?.id || !req.user?.role) {
    throw new AppError(401, "Unauthorized", "AUTH_REQUIRED");
  }

  const profile = await authService.updateProfile({
    userId: req.user.id,
    role: req.user.role,
    name: req.body?.name,
    email: req.body?.email,
    phone: req.body?.phone,
    specialization: req.body?.specialization,
    currentPassword: req.body?.currentPassword,
    newPassword: req.body?.newPassword,
  });

  return res.json({ success: true, data: profile });
};
