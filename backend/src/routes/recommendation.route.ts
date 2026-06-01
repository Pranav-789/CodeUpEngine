import { Router } from "express";
import { getActiveRecommendation, generateRecommendation, checkJobStatus } from "../controllers/recommendation.controller.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/active",requireAuth, getActiveRecommendation);
router.post("/generate",requireAuth, generateRecommendation);
router.get("/status/:jobId", requireAuth, checkJobStatus);

export default router;