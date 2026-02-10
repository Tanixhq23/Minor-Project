import { Router } from "express";
import patientRoutes from "./patient.routes.js";
import recordsRoutes from "./records.routes.js";
import logsRoutes from "./logs.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/patient", patientRoutes);
router.use("/records", recordsRoutes);
router.use("/logs", logsRoutes);

export default router;
