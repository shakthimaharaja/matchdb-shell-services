import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma";
import {
  stripe,
  VENDOR_PLAN_DEFINITIONS,
  CANDIDATE_PACKAGES,
  CandidatePackageId,
  createOrGetStripeCustomer,
  createCheckoutSession,
  createOneTimeCheckoutSession,
  createCustomerPortalSession,
} from "../services/stripe.service";
import { sendSubscriptionActivatedEmail } from "../services/sendgrid.service";
import { env } from "../config/env";

// SQLite doesn't support Prisma enums — define locally
type VendorPlan = "free" | "basic" | "pro" | "pro_plus";
type SubStatus = "active" | "inactive" | "trialing" | "canceled" | "past_due";

// ─── Subdomain constants ──────────────────────────────────────────────────────

const CONTRACT_SUBDOMAINS = ["c2c", "c2h", "w2", "1099"];
const FULLTIME_SUBDOMAINS = ["c2h", "w2", "direct_hire", "salary"];

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
    let subs: string[] = [];
    try {
      subs = JSON.parse(payment.subdomains) as string[];
    } catch {
      subs = [];
    }

    if (payment.packageType === "full_bundle") {
      // Full bundle: all subdomains across both domains
      config["contract"] = [...CONTRACT_SUBDOMAINS];
      config["full_time"] = [...FULLTIME_SUBDOMAINS];
    } else if (
      payment.packageType === "single_domain_bundle" &&
      payment.domain
    ) {
      const allSubs =
        payment.domain === "contract"
          ? CONTRACT_SUBDOMAINS
          : FULLTIME_SUBDOMAINS;
      if (!config[payment.domain]) {
        config[payment.domain] = [];
      }
      // Union merge
      for (const s of allSubs) {
        if (!config[payment.domain].includes(s)) {
          config[payment.domain].push(s);
        }
      }
    } else if (payment.domain && subs.length > 0) {
      // base or subdomain_addon: union the specific subdomains into the domain key
      if (!config[payment.domain]) {
        config[payment.domain] = [];
      }
      for (const s of subs) {
        if (!config[payment.domain].includes(s)) {
          config[payment.domain].push(s);
        }
      }
    }
  }

  return config;
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
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.user!.userId },
    });
    res.json({ subscription: sub || { plan: "free", status: "active" } });
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

    if (!plan || !plan.stripePriceId) {
      res.status(400).json({ error: "Invalid plan or free plan selected" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { subscription: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.userType !== "vendor") {
      res
        .status(403)
        .json({ error: "Vendor account required for subscription plans" });
      return;
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await createOrGetStripeCustomer(
        user.id,
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      );
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId,
          plan: "free",
          status: "active",
        },
        update: { stripeCustomerId },
      });
    }

    const url = await createCheckoutSession({
      stripeCustomerId,
      stripePriceId: plan.stripePriceId,
      successUrl: `${env.CLIENT_URL}/?success=true`,
      cancelUrl: `${env.CLIENT_URL}/?canceled=true`,
      userId: user.id,
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ─── Candidate Checkout (one-time payment) ────────────────────────────────────

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
    if (!pkg || !pkg.stripePriceId) {
      res
        .status(400)
        .json({ error: "Invalid package ID or package not configured" });
      return;
    }

    // Validate required fields per package type
    if (packageId === "base") {
      if (!domain) {
        res
          .status(400)
          .json({
            error:
              "Domain (contract or full_time) is required for the base package",
          });
        return;
      }
      if (!subdomains || subdomains.length !== 1) {
        res
          .status(400)
          .json({
            error:
              "Exactly one subdomain must be selected for the base package",
          });
        return;
      }
    }
    if (packageId === "subdomain_addon") {
      if (!domain) {
        res
          .status(400)
          .json({ error: "Domain is required for subdomain add-ons" });
        return;
      }
      if (!subdomains || subdomains.length === 0) {
        res
          .status(400)
          .json({ error: "At least one subdomain must be selected" });
        return;
      }
    }
    if (packageId === "single_domain_bundle" && !domain) {
      res
        .status(400)
        .json({
          error:
            "Domain (contract or full_time) is required for single domain bundle",
        });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { subscription: true },
    });
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
    let stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await createOrGetStripeCustomer(
        user.id,
        user.email,
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      );
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId,
          plan: "free",
          status: "active",
        },
        update: { stripeCustomerId },
      });
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
      userId: user.id,
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

// ─── Billing Portal ───────────────────────────────────────────────────────────

export async function createPortal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.user!.userId },
    });
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
      // ── Vendor recurring subscription events ──
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const priceId = sub.items.data[0]?.price.id || "";
        const planDef = VENDOR_PLAN_DEFINITIONS.find(
          (p) => p.stripePriceId === priceId,
        );

        // Map plan definition ID → plan string
        const plan = (
          planDef?.id === "pro_plus"
            ? "pro_plus"
            : planDef?.id === "pro"
              ? "pro"
              : planDef?.id === "basic"
                ? "basic"
                : "free"
        ) as VendorPlan;

        const status = sub.status as SubStatus;
        const currentPeriodEnd = new Date(sub.current_period_end * 1000);

        const updatedSub = await prisma.subscription.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan,
            status,
            stripeSubId: sub.id,
            stripePriceId: priceId,
            currentPeriodEnd,
          },
        });

        if (
          updatedSub.count > 0 &&
          event.type === "customer.subscription.created"
        ) {
          const dbSub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (dbSub) {
            const user = await prisma.user.findUnique({
              where: { id: dbSub.userId },
            });
            if (user) {
              sendSubscriptionActivatedEmail({
                to: user.email,
                firstName: user.firstName || "there",
                plan,
                currentPeriodEnd,
              }).catch(console.error);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: {
            plan: "free",
            status: "canceled",
            stripeSubId: null,
            stripePriceId: null,
            currentPeriodEnd: null,
          },
        });
        break;
      }

      // ── Candidate one-time payment event ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Skip subscription-mode sessions (handled via subscription events above)
        if (session.mode !== "payment") break;

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
          break;
        }

        let subdomains: string[] = [];
        try {
          subdomains = JSON.parse(subdomainsRaw) as string[];
        } catch {
          subdomains = [];
        }

        // Idempotency: stripeSessionId is unique; catch P2002 and treat as no-op
        try {
          await prisma.candidatePayment.create({
            data: {
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
            },
          });
        } catch (e: any) {
          if (e?.code === "P2002") {
            // Already processed (duplicate webhook delivery) — safe to ignore
            console.log(
              "[Stripe Webhook] Duplicate session event ignored:",
              session.id,
            );
            break;
          }
          throw e;
        }

        // Recompute full membership config from ALL completed payments for this user
        const allPayments = await prisma.candidatePayment.findMany({
          where: { userId, status: "completed" },
          select: { packageType: true, domain: true, subdomains: true },
        });

        const newConfig = computeMembershipConfig(allPayments);

        await prisma.user.update({
          where: { id: userId },
          data: {
            membershipConfig: JSON.stringify(newConfig),
            hasPurchasedVisibility: true,
          },
        });

        console.log(
          `[Stripe Webhook] Candidate visibility updated for user ${userId}:`,
          newConfig,
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
