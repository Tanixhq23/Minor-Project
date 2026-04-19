const AccessToken = require("../models/AccessToken");
const DoctorHistory = require("../models/DoctorHistory");
const AppError = require("../utils/AppError");

async function requireConsent(req, res, next) {
  const patientId = req.params.patientId;
  const doctorId = req.user.id;

  const consent = await AccessToken.findOne({
    doctorId: req.user.id,
    patientId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (consent) {
    req.consent = consent;
    return next();
  }

  // Fallback: Check for persistent history (3-day window)
  const history = await DoctorHistory.findOne({
    doctorId: req.user.id,
    patientId,
    expiresAt: { $gt: new Date() }
  });

  if (history) {
    return next();
  }

  throw new AppError("No active consent or expired session", 403);
}

module.exports = {
  requireConsent,
};
