import { Router } from "express";
import express from "express";
import {
  getPlans,
  getSubscription,
  createCheckout,
  createPortal,
  stripeWebhook,
} from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Webhook must use raw body — mounted BEFORE express.json() in app.ts
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

router.get("/plans", getPlans);
router.get("/subscription", requireAuth, getSubscription);
router.post("/checkout", requireAuth, createCheckout);
router.post("/portal", requireAuth, createPortal);

export default router;
