const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, "..", "storage"),
  logDir: process.env.LOG_DIR || path.join(__dirname, "..", "logs"),
  logLevel: process.env.LOG_LEVEL || "info",
  tokenTtlMin: Number(process.env.TOKEN_TTL_MIN || 15),
  otpTtlMin: Number(process.env.OTP_TTL_MIN || 8),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  appBaseUrl: process.env.APP_BASE_URL || "https://healthlock-backend.onrender.com",
};

module.exports = env;
