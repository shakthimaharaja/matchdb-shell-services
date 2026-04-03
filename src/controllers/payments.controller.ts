import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { User, Subscription, CandidatePayment } from "../models";
import {
  stripe,
  VENDOR_PLAN_DEFINITIONS,
  MARKETER_PLAN,
  CANDIDATE_PACKAGES,
  CandidatePackageId,
  createOrGetStripeCustomer,
  createCheckoutSession,
  createOneTimeCheckoutSession,
  createCustomerPortalSession,
} from "../services/stripe.service";
import { sendSubscriptionActivatedEmail } from "../services/sendgrid.service";
import { env } from "../config/env";

// Define plan and status types locally
type EmployerPlan = "free" | "basic" | "pro" | "pro_plus";
type SubStatus = "active" | "inactive" | "trialing" | "canceled" | "past_due";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_EMPLOYER_PLANS = new Set<string>(["pro_plus", "pro", "basic"]);

function resolvePlanFromDef(planDef: { id: string } | undefined): EmployerPlan {
  if (planDef && VALID_EMPLOYER_PLANS.has(planDef.id)) {
    return planDef.id as EmployerPlan;
  }
  return "free";
}

import { CONTRACT_SUBDOMAINS, FULLTIME_SUBDOMAINS } from "../constants";

/**
 * Aggregates all completed CandidatePayment records for a user into a
 * single membershipConfig object (union of all purchased visibility).
 */
function computeMembershipConfig(
  payments: Array<{
    packageType: string;
    domain: string | null;
    subdomains: string;
  }>,
): Record<string, string[]> {
  const config: Record<string, string[]> = {};

  for (const payment of payments) {
    processPayment(config, payment);
  }

  return config;
}

function unionMerge(
  config: Record<string, string[]>,
  domain: string,
  subs: string[],
): void {
  if (!config[domain]) {
    config[domain] = [];
  }
  for (const s of subs) {
    if (!config[domain].includes(s)) {
      config[domain].push(s);
    }
  }
}

function processPayment(
  config: Record<string, string[]>,
  payment: { packageType: string; domain: string | null; subdomains: string },
): void {
  if (payment.packageType === "full_bundle") {
    config["contract"] = [...CONTRACT_SUBDOMAINS];
    config["full_time"] = [...FULLTIME_SUBDOMAINS];
    return;
  }

  if (!payment.domain) return;

  if (payment.packageType === "single_domain_bundle") {
    const allSubs =
      payment.domain === "contract" ? CONTRACT_SUBDOMAINS : FULLTIME_SUBDOMAINS;
    unionMerge(config, payment.domain, allSubs);
    return;
  }

  let subs: string[] = [];
  try {
    subs = JSON.parse(payment.subdomains) as string[];
  } catch {
    subs = [];
  }

  if (subs.length > 0) {
    unionMerge(config, payment.domain, subs);
  }
}

// ─── Plans / Packages ─────────────────────────────────────────────────────────

export function getPlans(_req: Request, res: Response): void {
  res.json({ plans: VENDOR_PLAN_DEFINITIONS });
}

export function getCandidatePackages(_req: Request, res: Response): void {
  res.json({ packages: CANDIDATE_PACKAGES });
}

// ─── Subscription (vendor) ────────────────────────────────────────────────────

export async function getSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sub = await Subscription.findOne({ userId: req.user!.userId });
    res.json({ subscription: sub ?? { plan: "free", status: "active" } });
  } catch (err) {
    next(err);
  }
}

// ─── Vendor Checkout (recurring subscription) ─────────────────────────────────

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { planId } = req.body as { planId?: string };
    const plan = VENDOR_PLAN_DEFINITIONS.find((p) => p.id === planId);

    if (!plan?.stripePriceId) {
      res.status(400).json({ error: "Invalid plan or free plan selected" });
      return;
    }

    const user = await User.findById(req.user!.userId);
    const subscription = user
      ? await Subscription.findOne({ userId: user._id })
      : null;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.userType !== "employer") {
      res.status(403).json({
        error: "Employer account required for subscription plans",
      });
      return;
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await createOrGetStripeCustomer(
        user._id,
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      );
      await Subscription.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, stripeCustomerId, plan: "free", status: "active" },
        { upsert: true, new: true },
      );
    }

    const url = await createCheckoutSession({
      stripeCustomerId,
      stripePriceId: plan.stripePriceId,
      successUrl: `${env.CLIENT_URL}/?success=true`,
      cancelUrl: `${env.CLIENT_URL}/?canceled=true`,
      userId: user._id,
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ─── Candidate Checkout (one-time payment) ────────────────────────────────────

function validateCandidatePackageInput(
  packageId: CandidatePackageId,
  domain: string | undefined,
  subdomains: string[] | undefined,
): string | null {
  if (packageId === "base") {
    if (!domain)
      return "Domain (contract or full_time) is required for the base package";
    if (!subdomains?.length || subdomains.length !== 1)
      return "Exactly one subdomain must be selected for the base package";
  }
  if (packageId === "subdomain_addon") {
    if (!domain) return "Domain is required for subdomain add-ons";
    if (!subdomains || subdomains.length === 0)
      return "At least one subdomain must be selected";
  }
  if (packageId === "single_domain_bundle" && !domain) {
    return "Domain (contract or full_time) is required for single domain bundle";
  }
  return null;
}

export async function createCandidateCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { packageId, domain, subdomains } = req.body as {
      packageId?: CandidatePackageId;
      domain?: "contract" | "full_time";
      subdomains?: string[];
    };

    if (!packageId) {
      res.status(400).json({ error: "packageId is required" });
      return;
    }

    const pkg = CANDIDATE_PACKAGES.find((p) => p.id === packageId);
    if (!pkg?.stripePriceId) {
      res
        .status(400)
        .json({ error: "Invalid package ID or package not configured" });
      return;
    }

    const validationError = validateCandidatePackageInput(
      packageId,
      domain,
      subdomains,
    );
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const user = await User.findById(req.user!.userId);
    const subscription = user
      ? await Subscription.findOne({ userId: user._id })
      : null;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.userType !== "candidate") {
      res
        .status(403)
        .json({ error: "Candidate account required for visibility packages" });
      return;
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await createOrGetStripeCustomer(
        user._id,
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      );
      await Subscription.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, stripeCustomerId, plan: "free", status: "active" },
        { upsert: true, new: true },
      );
    }

    // For addon: quantity = number of subdomains (each costs $2)
    const quantity =
      packageId === "subdomain_addon" ? subdomains?.length || 1 : 1;
    const resolvedDomain = domain || "";
    const resolvedSubdomains = subdomains || [];

    const url = await createOneTimeCheckoutSession({
      stripeCustomerId,
      stripePriceId: pkg.stripePriceId,
      quantity,
      successUrl: `${env.CLIENT_URL}/?candidate_success=true`,
      cancelUrl: `${env.CLIENT_URL}/?canceled=true`,
      userId: user._id,
      metadata: {
        package_id: packageId,
        domain: resolvedDomain,
        subdomains: JSON.stringify(resolvedSubdomains),
        quantity: String(quantity),
      },
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ─── Marketer Checkout (recurring subscription) ───────────────────────────────

export async function createMarketerCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!MARKETER_PLAN.stripePriceId) {
      res.status(503).json({ error: "Marketer plan is not configured yet" });
      return;
    }

    const user = await User.findById(req.user!.userId);
    const subscription = user
      ? await Subscription.findOne({ userId: user._id })
      : null;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.userType !== "employer") {
      res.status(403).json({ error: "Employer account required" });
      return;
    }

    let stripeCustomerId = subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await createOrGetStripeCustomer(
        user._id,
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      );
      await Subscription.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          stripeCustomerId,
          plan: "free",
          status: "inactive",
        },
        { upsert: true, new: true },
      );
    }

    const url = await createCheckoutSession({
      stripeCustomerId,
      stripePriceId: MARKETER_PLAN.stripePriceId,
      successUrl: `${env.CLIENT_URL}/?success=true`,
      cancelUrl: `${env.CLIENT_URL}/?canceled=true`,
      userId: user._id,
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ─── Billing Portal ───────────────────────────────────────────────────────────

export async function createPortal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sub = await Subscription.findOne({ userId: req.user!.userId });
    if (!sub?.stripeCustomerId) {
      res
        .status(400)
        .json({ error: "No billing account found. Please subscribe first." });
      return;
    }

    const url = await createCustomerPortalSession(
      sub.stripeCustomerId,
      `${env.CLIENT_URL}/`,
    );
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ─── Stripe Webhook ───────────────────────────────────────────────────────────

export async function stripeWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

// ─── Webhook event handlers ───────────────────────────────────────────────────

async function handleSubscriptionUpsert(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  const customerId = sub.customer as string;
  const priceId = sub.items.data[0]?.price.id || "";

  let plan: string;
  if (priceId && priceId === MARKETER_PLAN.stripePriceId) {
    plan = "marketer";
  } else {
    const planDef = VENDOR_PLAN_DEFINITIONS.find(
      (p) => p.stripePriceId === priceId,
    );
    plan = resolvePlanFromDef(planDef);
  }

  const status = sub.status as SubStatus;
  const currentPeriodEnd = new Date(sub.current_period_end * 1000);

  const updatedSub = await Subscription.updateMany(
    { stripeCustomerId: customerId },
    {
      plan,
      status,
      stripeSubId: sub.id,
      stripePriceId: priceId,
      currentPeriodEnd,
    },
  );

  if (
    updatedSub.modifiedCount > 0 &&
    event.type === "customer.subscription.created"
  ) {
    await sendActivationEmail(customerId, plan, currentPeriodEnd);
  }
}

async function sendActivationEmail(
  customerId: string,
  plan: string,
  currentPeriodEnd: Date,
): Promise<void> {
  const dbSub = await Subscription.findOne({ stripeCustomerId: customerId });
  if (!dbSub) return;

  const user = await User.findById(dbSub.userId);
  if (!user) return;

  sendSubscriptionActivatedEmail({
    to: user.email,
    firstName: user.firstName || "there",
    plan,
    currentPeriodEnd,
  }).catch(console.error);
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const sub = event.data.object as Stripe.Subscription;
  await Subscription.updateMany(
    { stripeCustomerId: sub.customer as string },
    {
      plan: "free",
      status: "canceled",
      stripeSubId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
    },
  );
}

async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  // Skip subscription-mode sessions (handled via subscription events above)
  if (session.mode !== "payment") return;

  const userId = session.metadata?.matchdb_user_id;
  const packageId = session.metadata?.package_id as
    | CandidatePackageId
    | undefined;
  const domain = session.metadata?.domain || null;
  const subdomainsRaw = session.metadata?.subdomains || "[]";

  if (!userId || !packageId) {
    console.error(
      "[Stripe Webhook] Missing metadata on payment session:",
      session.id,
    );
    return;
  }

  let subdomains: string[] = [];
  try {
    subdomains = JSON.parse(subdomainsRaw) as string[];
  } catch {
    subdomains = [];
  }

  // Idempotency: stripeSessionId is unique; catch duplicate key and treat as no-op
  try {
    await CandidatePayment.create({
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      packageType: packageId,
      domain: domain || null,
      subdomains: JSON.stringify(subdomains),
      amountCents: session.amount_total || 0,
      status: "completed",
    });
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      console.log(
        "[Stripe Webhook] Duplicate session event ignored:",
        session.id,
      );
      return;
    }
    throw e;
  }

  // Recompute full membership config from ALL completed payments for this user
  const allPayments = await CandidatePayment.find(
    { userId, status: "completed" },
    { packageType: 1, domain: 1, subdomains: 1 },
  ).lean();

  const newConfig = computeMembershipConfig(
    allPayments as Array<{
      packageType: string;
      domain: string | null;
      subdomains: string;
    }>,
  );

  await User.updateOne(
    { _id: userId },
    {
      membershipConfig: JSON.stringify(newConfig),
      hasPurchasedVisibility: true,
    },
  );

  console.log(
    `[Stripe Webhook] Candidate visibility updated for user ${userId}:`,
    newConfig,
  );
}
