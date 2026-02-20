import Stripe from 'stripe';
import { env } from '../config/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

// ─── Vendor Subscription Plans (recurring monthly) ───────────────────────────

export interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | null;
  features: string[];
  stripePriceId: string;
  highlighted?: boolean;
  jobLimit: number;      // max active job postings
  pokeLimit: number;     // monthly pokes (Infinity = unlimited)
}

export const VENDOR_PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      '0 active job postings',
      'Browse candidate profiles',
      'Saved searches',
    ],
    stripePriceId: '',
    jobLimit: 0,
    pokeLimit: 0,
  },
  {
    id: 'basic',
    name: 'Basic Membership',
    price: 22,
    interval: 'month',
    features: [
      '5 active job postings',
      'Candidate matching & shortlisting',
      '25 Poke messages/month',
      'Basic analytics dashboard',
    ],
    stripePriceId: env.STRIPE_PRICE_VENDOR_BASIC,
    jobLimit: 5,
    pokeLimit: 25,
  },
  {
    id: 'pro',
    name: 'Pro Membership',
    price: 39,
    interval: 'month',
    features: [
      '10 active job postings',
      'Priority candidate matching',
      '50 Poke messages/month',
      'Advanced analytics & reports',
      'Email support',
    ],
    stripePriceId: env.STRIPE_PRICE_VENDOR_PRO,
    highlighted: true,
    jobLimit: 10,
    pokeLimit: 50,
  },
  {
    id: 'pro_plus',
    name: 'Pro Plus Membership',
    price: 69,
    interval: 'month',
    features: [
      '20 active job postings',
      'Unlimited Poke messages',
      'Dedicated account manager',
      'API access & custom integrations',
      'Priority support',
    ],
    stripePriceId: env.STRIPE_PRICE_VENDOR_PRO_PLUS,
    jobLimit: 20,
    pokeLimit: Infinity,
  },
];

// ─── Candidate One-Time Visibility Packages ───────────────────────────────────

export type CandidatePackageId =
  | 'base'
  | 'subdomain_addon'
  | 'single_domain_bundle'
  | 'full_bundle';

export interface CandidatePackage {
  id: CandidatePackageId;
  name: string;
  price: number;        // in USD
  priceCents: number;   // for Stripe
  description: string;
  details: string;
  stripePriceId: string;
}

export const CANDIDATE_PACKAGES: CandidatePackage[] = [
  {
    id: 'base',
    name: 'Starter Visibility',
    price: 13,
    priceCents: 1300,
    description: 'Profile creation + visibility in 1 subdomain of 1 domain',
    details: 'Choose Contract or Full Time, then pick one subdomain (e.g. C2C, W2) to be visible to employers in.',
    stripePriceId: env.STRIPE_PRICE_CANDIDATE_BASE,
  },
  {
    id: 'subdomain_addon',
    name: 'Add a Subdomain',
    price: 2,
    priceCents: 200,
    description: '+$2 per additional subdomain',
    details: 'Expand your visibility one subdomain at a time. Price per subdomain selected.',
    stripePriceId: env.STRIPE_PRICE_CANDIDATE_SUBDOMAIN_ADDON,
  },
  {
    id: 'single_domain_bundle',
    name: 'Single Domain Bundle',
    price: 17,
    priceCents: 1700,
    description: 'All 4 subdomains within one domain — save $2',
    details: 'Get full visibility across all subtypes in either Contract (C2C, C2H, W2, 1099) or Full Time (C2H, W2, Direct Hire, Salary).',
    stripePriceId: env.STRIPE_PRICE_CANDIDATE_SINGLE_DOMAIN,
  },
  {
    id: 'full_bundle',
    name: 'Full Visibility Bundle',
    price: 23,
    priceCents: 2300,
    description: 'All 8 subdomains across Contract + Full Time — best value, save $4',
    details: 'Maximum reach: appear in every employer search across all Contract and Full Time categories.',
    stripePriceId: env.STRIPE_PRICE_CANDIDATE_FULL_BUNDLE,
  },
];

// ─── Stripe Helpers ───────────────────────────────────────────────────────────

export async function createOrGetStripeCustomer(
  userId: string,
  email: string,
  name: string,
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { matchdb_user_id: userId },
  });
  return customer.id;
}

/** Creates a RECURRING subscription checkout session (for vendors). */
export async function createCheckoutSession(params: {
  stripeCustomerId: string;
  stripePriceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { matchdb_user_id: params.userId },
    allow_promotion_codes: true,
  });
  return session.url!;
}

/** Creates a ONE-TIME payment checkout session (for candidates). */
export async function createOneTimeCheckoutSession(params: {
  stripeCustomerId: string;
  stripePriceId: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  metadata: Record<string, string>;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: params.stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{ price: params.stripePriceId, quantity: params.quantity }],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { matchdb_user_id: params.userId, ...params.metadata },
  });
  return session.url!;
}

export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
