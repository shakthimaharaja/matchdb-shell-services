import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  verify,
  logout,
  deleteAccount,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/verify", requireAuth, verify);
router.post("/logout", requireAuth, logout);
router.delete("/account", requireAuth, deleteAccount);

export default router;
