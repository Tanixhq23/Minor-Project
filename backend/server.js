require("dotenv").config();
const app = require("./app");
const connectDb = require("./config/db");
const { logError } = require("./utils/logger");

process.on("uncaughtException", (error) => {
  logError("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logError("Unhandled promise rejection", reason);
});

const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect DB:", error);
    process.exit(1);
  });
