import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { prisma } from "../config/prisma";
import {
  stripe,
  PLAN_DEFINITIONS,
  createOrGetStripeCustomer,
  createCheckoutSession,
  createCustomerPortalSession,
} from "../services/stripe.service";
import { sendSubscriptionActivatedEmail } from "../services/sendgrid.service";
import { env } from "../config/env";

// SQLite doesn't support Prisma enums — define locally
type Plan = "free" | "pro" | "enterprise";
type SubStatus = "active" | "inactive" | "trialing" | "canceled" | "past_due";

export function getPlans(_req: Request, res: Response): void {
  res.json({ plans: PLAN_DEFINITIONS });
}

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

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { planId } = req.body as { planId?: string };
    const plan = PLAN_DEFINITIONS.find((p) => p.id === planId);

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
      successUrl: `${env.CLIENT_URL}/pricing?success=true`,
      cancelUrl: `${env.CLIENT_URL}/pricing?canceled=true`,
      userId: user.id,
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

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
      `${env.CLIENT_URL}/pricing`,
    );
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// Stripe webhook handler — raw body required
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
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const priceId = sub.items.data[0]?.price.id || "";
        const planDef = PLAN_DEFINITIONS.find(
          (p) => p.stripePriceId === priceId,
        );
        const plan = (
          planDef?.id.includes("enterprise")
            ? "enterprise"
            : planDef?.id.includes("pro")
              ? "pro"
              : "free"
        ) as Plan;
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
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
