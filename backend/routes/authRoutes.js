const router = require("express").Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { validateRequest } = require("../middlewares/validationMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { loginValidation, registerValidation } = require("../validations/authValidation");

router.post("/register", validateRequest(registerValidation), asyncHandler(authController.register));
router.post("/login", validateRequest(loginValidation), asyncHandler(authController.login));
router.get("/me", requireAuth, asyncHandler(authController.me));
router.patch("/profile", requireAuth, asyncHandler(authController.updateProfile));
router.post("/logout", asyncHandler(authController.logout));

module.exports = router;
