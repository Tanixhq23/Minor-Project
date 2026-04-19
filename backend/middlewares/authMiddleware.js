const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const AppError = require("../utils/AppError");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = req.cookies && req.cookies.token;
  const queryToken = req.query.token;
  const jwtToken = bearerToken || cookieToken || queryToken;

  if (!jwtToken) {
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const payload = jwt.verify(jwtToken, env.jwtSecret);
    const user = await User.findById(payload.sub).lean();

    if (!user) {
      return next(new AppError("Unauthorized", 401));
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    next(new AppError("Unauthorized", 401));
  }
}

module.exports = {
  requireAuth,
};
