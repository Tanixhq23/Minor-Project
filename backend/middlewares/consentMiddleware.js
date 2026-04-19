const Consent = require("../models/Consent");
const AppError = require("../utils/AppError");

async function requireConsent(req, res, next) {
  const { patientId } = req.params;
  const doctorId = req.user.id;

  const consent = await Consent.findOne({
    doctorId,
    patientId,
    status: "active",
    expiresAt: { $gt: new Date() },
  });

  if (!consent) {
    throw new AppError("No active consent or session has expired", 403);
  }

  req.consent = consent;
  next();
}


module.exports = {
  requireConsent,
};
