import { Router } from "express";
import { signup, signin, session, logout, me, updateMe } from "../controllers/auth.controller.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = Router();

router.post("/signup", wrapAsync(signup));
router.post("/signin", wrapAsync(signin));
router.get("/session", wrapAsync(session));
router.route("/me").get(wrapAsync(me)).put(wrapAsync(updateMe));
router.post("/logout", wrapAsync(logout));

export default router;
