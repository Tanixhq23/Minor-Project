import { Router } from "express";
import { getRecord } from "../controllers/records.controller.js";
import { attachDoctorContext } from "../middleware/index.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = Router();

router.get("/:id", attachDoctorContext, wrapAsync(getRecord));

export default router;
