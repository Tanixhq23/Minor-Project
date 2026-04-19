const mongoose = require("mongoose");
const env = require("./env");
const { logInfo } = require("../utils/logger");

async function connectDb() {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logInfo("MongoDB connected successfully");
}

module.exports = connectDb;
