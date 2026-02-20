import dotenv from 'dotenv';
import path from 'path';

const ENV = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, '../../env', `.env.${ENV}`) });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  NODE_ENV: ENV,
  PORT: parseInt(process.env.PORT || '8000', 10),

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // JWT
  JWT_SECRET: required('JWT_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '1h',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/auth/google/callback',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  // Vendor recurring subscription price IDs
  STRIPE_PRICE_VENDOR_BASIC: process.env.STRIPE_PRICE_VENDOR_BASIC || '',
  STRIPE_PRICE_VENDOR_PRO: process.env.STRIPE_PRICE_VENDOR_PRO || '',
  STRIPE_PRICE_VENDOR_PRO_PLUS: process.env.STRIPE_PRICE_VENDOR_PRO_PLUS || '',
  // Candidate one-time visibility package price IDs
  STRIPE_PRICE_CANDIDATE_BASE: process.env.STRIPE_PRICE_CANDIDATE_BASE || '',
  STRIPE_PRICE_CANDIDATE_SUBDOMAIN_ADDON: process.env.STRIPE_PRICE_CANDIDATE_SUBDOMAIN_ADDON || '',
  STRIPE_PRICE_CANDIDATE_SINGLE_DOMAIN: process.env.STRIPE_PRICE_CANDIDATE_SINGLE_DOMAIN || '',
  STRIPE_PRICE_CANDIDATE_FULL_BUNDLE: process.env.STRIPE_PRICE_CANDIDATE_FULL_BUNDLE || '',

  // SendGrid
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'noreply@matchdb.io',
  SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || 'MatchDB',

  // App
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:4000').split(','),
};
