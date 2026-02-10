import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./config/logger.js";
import requestLogger from "./middleware/requestLogger.js";
import { verifyToken } from "./utils/token.js";

const app = express();

// Set up security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        // ADDED Cloudflare access wildcard to script-src
        scriptSrc: [
          "'self'", 
          "https://unpkg.com", 
          "https://*.cloudflare.com",
          "https://*.cloudflareaccess.com", 
          "'unsafe-inline'"],
        frameSrc: ["'self'", "data:", "blob:"],
      },
    },
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
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
  if (req.path.startsWith("/api/auth")) return next();
  if (req.path.startsWith("/api/records/")) return next();
  if (req.path.startsWith("/api")) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }
  }
  next();
});

// Your API routes
app.use("/api", routes);

// 404 Not Found Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

export default app;
