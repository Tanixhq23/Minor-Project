const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let bucket;

/**
 * Lazily initializes and returns the GridFS bucket.
 * This ensures the mongoose connection is ready before we access the db object.
 */
function getBucket() {
  if (bucket) return bucket;

  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection not established. GridFS bucket cannot be initialized.");
  }

  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "medical_records",
  });
  return bucket;
}

module.exports = { getBucket };
