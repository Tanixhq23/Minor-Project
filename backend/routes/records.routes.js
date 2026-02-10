// FILE: routes/records.routes.js

import { Router } from "express";
import { getRecord } from "../controllers/records.controller.js";
import { attachDoctorContext } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:id", attachDoctorContext, getRecord);

export default router;
