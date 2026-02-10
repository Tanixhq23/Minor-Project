import { Router } from "express";
import { signup, signin, session, logout } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/session", session);
router.post("/logout", logout);

export default router;
