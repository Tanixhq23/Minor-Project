const fs = require("fs");
const path = require("path");
const AppError = require("./AppError");

/**
 * Streams a local file directly to the Express response.
 * @param {string} storagePath - Relative path from project root or absolute path
 * @param {string} mimeType - The content type of the file
 * @param {object} res - Express response object
 */
function streamLocalFile(storagePath, mimeType, res) {
  return new Promise((resolve, reject) => {
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
