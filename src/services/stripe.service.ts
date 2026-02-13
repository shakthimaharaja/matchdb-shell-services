import Stripe from 'stripe';
import { env } from '../config/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

export interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | null;
  userType: 'candidate' | 'vendor' | 'both';
  features: string[];
  stripePriceId: string;
  highlighted?: boolean;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'free_candidate',
    name: 'Candidate Free',
    price: 0,
    interval: null,
    userType: 'candidate',
    features: ['5 job applications/month', 'Basic skill matching', 'Browse job listings', '5 Poke messages/month'],
    stripePriceId: '',
  },
  {
    id: 'pro_candidate',
    name: 'Candidate Pro',
    price: 15,
    interval: 'month',
    userType: 'candidate',
    features: ['Unlimited applications', 'Priority matching algorithm', 'Profile visibility boost', '20 Poke messages/month', 'Application tracking'],
    stripePriceId: env.STRIPE_PRICE_PRO_CANDIDATE,
    highlighted: true,
  },
  {
    id: 'free_vendor',
    name: 'Vendor Free',
    price: 0,
    interval: null,
    userType: 'vendor',
    features: ['1 active job posting', 'Top 3 candidate matches', '3 Poke messages/month', 'Basic analytics'],
    stripePriceId: '',
  },
  {
    id: 'pro_vendor',
    name: 'Vendor Pro',
    price: 49,
    interval: 'month',
    userType: 'vendor',
    features: ['10 active job postings', 'Unlimited candidate matches', '50 Poke messages/month', 'Advanced analytics', 'Priority support'],
    stripePriceId: env.STRIPE_PRICE_PRO_VENDOR,
    highlighted: true,
  },
  {
    id: 'enterprise_vendor',
    name: 'Vendor Enterprise',
    price: 149,
    interval: 'month',
    userType: 'vendor',
    features: ['Unlimited job postings', 'Unlimited matches + Poke', 'Dedicated account manager', 'API access', 'Custom integrations'],
    stripePriceId: env.STRIPE_PRICE_ENTERPRISE_VENDOR,
  },
];

export async function createOrGetStripeCustomer(userId: string, email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { matchdb_user_id: userId },
  });
  return customer.id;
}

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

export async function createCustomerPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}
