const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const accessRoutes = require("./routes/accessRoutes");
const sendResponse = require("./utils/apiResponse");
const { loggerStream, logWarn } = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorMiddleware");
const { handleUploadError } = require("./middlewares/uploadMiddleware");

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(
  morgan(env.nodeEnv === "production" ? "combined" : ":method :url :status :response-time ms", {
    stream: loggerStream,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  handler: (req, res) => {
    logWarn("Rate limit exceeded", {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });

    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      data: null,
    });
  },
});

app.get("/", (req, res) => {
  res.send("HealthLock API is running");
});

app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  sendResponse(res, { message: "Health check passed", data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/access", accessRoutes);

app.use(handleUploadError);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
