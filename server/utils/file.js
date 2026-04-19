const fs = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createSafeFilename(originalName) {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safeName}`;
}

function getPatientUploadPath(baseDir, patientId) {
  return path.join(baseDir, "patients", patientId);
}

module.exports = {
  ensureDir,
  createSafeFilename,
  getPatientUploadPath,
};
