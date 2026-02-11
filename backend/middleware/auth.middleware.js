/**
 * Auth helper middleware used by routes that require strict role checks.
 */
export const attachDoctorContext = (req, _res, next) => {
  if (req.user?.role === "doctor" && req.user?.id) {
    req.doctorContext = { id: req.user.id };
  }
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  }
  return next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { message: "Forbidden" } });
  }
  return next();
};
