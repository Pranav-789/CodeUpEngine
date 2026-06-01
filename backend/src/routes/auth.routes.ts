import {Router} from "express";
import { confirmResetPassword, forgotPasswordRequest, login, logout, register, verifyEmail, refreshAccessToken, resetPassword, updateCodeforcesHandle } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post('/register', register)

router.get('/verify-email/:token', verifyEmail)

router.post('/login', login)

router.post('/logout', logout)

router.put('/forgot-password', forgotPasswordRequest)

router.post('/confirm-reset-password/:token', confirmResetPassword)

router.post('/refresh-token', refreshAccessToken)

router.post('/reset-password', requireAuth, resetPassword)

router.put('/update-codeforces-handle', requireAuth, updateCodeforcesHandle)

export default router;