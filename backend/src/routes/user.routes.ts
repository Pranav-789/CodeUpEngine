import {Router} from "express";
import { getProfile, syncCodeforcesProfile, getProfileMetrics } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get('/me', requireAuth, getProfile)
router.get('/metrics', requireAuth, getProfileMetrics)
router.post('/sync-codeforces-profile', requireAuth, syncCodeforcesProfile)

export default router;