import * as authService from "../services/auth.service.js";
import { createToken, verifyToken } from "../utils/token.js";
import { sendLoginEmail, sendSignupEmail } from "../services/notification.js";

const redirectForRole = (role) => (role === "doctor" ? "/doctor" : "/patient");

const TOKEN_COOKIE = "auth_token";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const cookieOptions = (rememberMe) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  ...(rememberMe ? { maxAge: THIRTY_DAYS_MS } : {}),
});

const setAuthCookie = (res, token, rememberMe) => {
  res.cookie(TOKEN_COOKIE, token, cookieOptions(rememberMe));
};

const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE, cookieOptions(false));
};

export const signup = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

export const session = async (req, res, next) => {
  try {
    const token = req.cookies?.[TOKEN_COOKIE] || null;
    if (!token) {
      const err = new Error("Not authenticated");
      err.status = 401;
      throw err;
    }
    const payload = verifyToken(token);
    if (!payload) {
      const err = new Error("Invalid session");
      err.status = 401;
      throw err;
    }
    return res.json({
      success: true,
      data: { userId: payload.sub, role: payload.role },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req, res, _next) => {
  clearAuthCookie(res);
  return res.json({ success: true });
};
