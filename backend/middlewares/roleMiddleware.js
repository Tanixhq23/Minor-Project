const AppError = require("../utils/AppError");

function requireRole(role) {
  return function roleMiddleware(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return next(new AppError("Forbidden", 403));
    }

    next();
  };
}

module.exports = {
  requireRole,
};
