const AppError = require("../utils/AppError");
const { logError } = require("../utils/logger");

function notFoundHandler(req, res, next) {
  next(new AppError("Route not found", 404));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Server error";

  logError(message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    data: err.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
