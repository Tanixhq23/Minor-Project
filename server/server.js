const app = require("./app");
const env = require("./config/env");
const connectDb = require("./config/db");
const { logError, logInfo } = require("./utils/logger");

process.on("uncaughtException", (error) => {
  logError("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logError("Unhandled promise rejection", reason);
});

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      logInfo(`Server listening on port ${env.port}`, {
        env: env.nodeEnv,
        corsOrigin: env.corsOrigin,
      });
    });
  })
  .catch((error) => {
    logError("Failed to connect DB", error);
    process.exit(1);
  });
