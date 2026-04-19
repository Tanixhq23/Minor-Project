function registerValidation(req) {
  const { role, name, email, password } = req.body;

  if (!role || !name || !email || !password) {
    return { message: "Missing required fields" };
  }

  if (!["patient", "doctor"].includes(role)) {
    return { message: "Invalid role" };
  }

  return null;
}

function loginValidation(req) {
  const { email, password } = req.body;

  if (!email || !password) {
    return { message: "Missing credentials" };
  }

  return null;
}

module.exports = {
  registerValidation,
  loginValidation,
};
