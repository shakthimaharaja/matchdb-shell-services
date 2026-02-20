import { Router } from "express";
import express from "express";
import {
  getPlans,
  getCandidatePackages,
  getSubscription,
  createCheckout,
  createCandidateCheckout,
  createPortal,
  stripeWebhook,
} from "../controllers/payments.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Stripe webhook must use raw body — mounted BEFORE express.json() in app.ts
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// Public plan/package info
router.get("/plans", getPlans);
router.get("/candidate-packages", getCandidatePackages);

// Auth-gated routes
router.get("/subscription", requireAuth, getSubscription);
router.post("/checkout", requireAuth, createCheckout);               // Vendor recurring
router.post("/candidate-checkout", requireAuth, createCandidateCheckout); // Candidate one-time
router.post("/portal", requireAuth, createPortal);                   // Billing portal

export default router;
