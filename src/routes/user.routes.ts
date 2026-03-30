import { Router } from "express";
import {
  getPreferences,
  updatePreferences,
} from "../controllers/preferences.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.get("/preferences", requireAuth, getPreferences);
router.put("/preferences", requireAuth, updatePreferences);

export default router;
