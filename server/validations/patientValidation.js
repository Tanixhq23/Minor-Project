function consentIdValidation(req) {
  if (!req.params.consentId) {
    return { message: "Consent id is required" };
  }

  return null;
}

function patientFileValidation(req) {
  if (!req.file) {
    return { message: "No file uploaded" };
  }

  return null;
}

module.exports = {
  consentIdValidation,
  patientFileValidation,
};
