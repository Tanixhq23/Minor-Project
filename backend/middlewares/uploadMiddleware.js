const multer = require("multer");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/AppError");

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const QR_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];
const DOCUMENT_MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const QR_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

// Storage configuration with custom path per patient
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const dir = path.join(process.cwd(), "uploads", userId);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

function createMimeFilter(allowedMimeTypes) {
  return function fileFilter(req, file, cb) {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError("Invalid file type", 400));
    }
    cb(null, true);
  };
}

const documentUpload = multer({
  storage: storage,
  fileFilter: createMimeFilter(DOCUMENT_MIME_TYPES),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const qrImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: createMimeFilter(QR_IMAGE_MIME_TYPES),
  limits: { fileSize: QR_IMAGE_MAX_SIZE },
});

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File is too large", 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
}

module.exports = {
  documentUpload,
  qrImageUpload,
  handleUploadError,
};
