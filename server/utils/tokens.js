const crypto = require("crypto");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateOtp() {
  const num = crypto.randomInt(0, 1000000);
  return num.toString().padStart(6, "0");
}

module.exports = { generateToken, hashToken, generateOtp };
