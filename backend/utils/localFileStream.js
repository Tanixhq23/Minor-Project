const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const AppError = require("./AppError");
const { getBucket } = require("../config/gridfs");

function streamLocalFile(storagePath, mimeType, res) {
  return new Promise((resolve, reject) => {
    if (storagePath.startsWith("gridfs:")) {

      try {
        const bucket = getBucket();
        const fileId = storagePath.split(":")[1];
        
        const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));

        downloadStream.on("file", (file) => {
          res.setHeader("Content-Type", file.contentType || mimeType || "application/octet-stream");
          res.setHeader("Content-Length", file.length);
          res.setHeader("Content-Disposition", "inline");
        });

        downloadStream.pipe(res);
        downloadStream.on("end", resolve);
        downloadStream.on("error", (err) => {
          if (err.code === "ENOENT") {
            reject(new AppError("File not found in database", 404));
          } else {
            reject(new AppError("Database stream error: " + err.message, 500));
          }
        });
      } catch (err) {
        reject(new AppError("Invalid storage identifier", 400));
      }
      return;
    }

    // Handle Local Files (Backward Compatibility)
    const absolutePath = path.isAbsolute(storagePath) 
      ? storagePath 
      : path.join(process.cwd(), storagePath);

    if (!fs.existsSync(absolutePath)) {
      return reject(new AppError("File not found on disk", 404));
    }

    const stat = fs.statSync(absolutePath);

    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", "inline");

    const readStream = fs.createReadStream(absolutePath);
    readStream.pipe(res);
    readStream.on("end", resolve);
    readStream.on("error", (err) => {
      reject(new AppError("File stream error: " + err.message, 500));
    });
  });
}

module.exports = { streamLocalFile };
