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
      console.log(`Server listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect DB:", error);
    process.exit(1);
  });

