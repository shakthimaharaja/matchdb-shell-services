import { Router } from "express";
import {
  register,
  login,
  googleAuth,
  googleCallback,
  refreshToken,
  verify,
  logout,
  deleteAccount,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Email / password
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/verify", requireAuth, verify);
router.post("/logout", requireAuth, logout);
router.delete("/account", requireAuth, deleteAccount);

// Google OAuth (stateless — no sessions)
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
