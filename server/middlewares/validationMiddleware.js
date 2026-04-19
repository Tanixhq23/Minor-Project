const AppError = require("../utils/AppError");

function validateRequest(schema) {
  return function validationMiddleware(req, res, next) {
    const result = schema(req);

    if (result) {
      return next(new AppError(result.message, 400, result.details || null));
    }

    next();
  };
}

module.exports = {
  validateRequest,
};
