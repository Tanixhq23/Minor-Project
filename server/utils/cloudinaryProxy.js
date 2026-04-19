const https = require("https");
const cloudinary = require("../config/cloudinary");
const AppError = require("./AppError");

function streamCloudinaryFile(publicId, resourceType, mimeType, res) {
  return new Promise((resolve, reject) => {
    const fileUrl = cloudinary.url(publicId, {
      resource_type: resourceType || "raw",
      sign_url: true,
      secure: true,
      type: "upload",
    });

    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebkit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    };

    https.get(fileUrl, options, (cloudRes) => {
      if (cloudRes.statusCode >= 400) {
        cloudRes.resume();
        return reject(new AppError(`Storage fetch failed (HTTP ${cloudRes.statusCode})`, 502));
      }

      res.setHeader("Content-Type", mimeType || "application/octet-stream");
      if (cloudRes.headers["content-length"]) {
        res.setHeader("Content-Length", cloudRes.headers["content-length"]);
      }
      res.setHeader("Content-Disposition", "inline");

      cloudRes.pipe(res);
      cloudRes.on("end", resolve);
      cloudRes.on("error", reject);
    }).on("error", (err) => {
      reject(new AppError("Cloudinary stream error: " + err.message, 500));
    });
  });
}

module.exports = { streamCloudinaryFile };
