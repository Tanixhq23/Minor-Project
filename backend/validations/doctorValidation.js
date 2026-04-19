function qrTokenValidation(req) {
  if (!req.body.token) {
    return { message: "Token required" };
  }

  return null;
}

function otpValidation(req) {
  if (!req.body.otp) {
    return { message: "OTP required" };
  }

  return null;
}

function qrImageValidation(req) {
  if (!req.file || !req.file.buffer) {
    return { message: "QR image required" };
  }

  return null;
}

module.exports = {
  qrTokenValidation,
  otpValidation,
  qrImageValidation,
};
