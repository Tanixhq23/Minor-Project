import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
  logger.info(
    {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
    "Incoming request",
  );
  next();
};

export default requestLogger;
