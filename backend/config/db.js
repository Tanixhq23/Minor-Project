const mongoose = require("mongoose");
const { logInfo } = require("../utils/logger");

async function connectDb() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  logInfo("MongoDB connected successfully");
}

module.exports = connectDb;
