import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import recordsRoutes from "./routes/records.routes.js";
import logsRoutes from "./routes/logs.routes.js";
import profileAccessRoutes from "./routes/profileAccess.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import { verifyToken } from "./utils/token.js";

const app = express();
app.set("trust proxy", 1);

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/+$/, "");

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many auth attempts. Try again later." } },
});

const recordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests. Slow down and retry." } },
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          "https://unpkg.com",
          "https://*.cloudflare.com",
          "https://*.cloudflareaccess.com",
          "'unsafe-inline'",
        ],
        frameSrc: ["'self'", "data:", "blob:"],
      },
    },
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
      const err = new Error("Not allowed by CORS");
      err.status = 403;
      return callback(err);
    },
    credentials: true,
  }),
);
app.use(requestLogger);

app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie || "";
  req.cookies = cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[decodeURIComponent(rawKey)] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
  next();
});

app.use((req, _res, next) => {
  const token = req.cookies?.auth_token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = { id: payload.sub, role: payload.role };
    }
  }
  next();
});

app.use((req, res, next) => {
  if (req.path === "/api/health") {
    return res.json({ success: true, data: { status: "ok" } });
  }
  if (req.path.startsWith("/api/auth")) return next();
  if (req.path.startsWith("/api/records/")) return next();
  if (req.path.startsWith("/api") && !req.user) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  }
  next();
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/records", recordLimiter, recordsRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/profile-access", profileAccessRoutes);

app.use((req, _res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use(errorHandler);

export default app;
