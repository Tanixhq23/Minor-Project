const jwt = require("jsonwebtoken");

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
  
  return jwt.sign(
    { sub: user._id.toString(), role: user.role }, 
    secret, 
    { expiresIn }
  );
}

module.exports = {
  signToken,
};
