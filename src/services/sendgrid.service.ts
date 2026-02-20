import sgMail from "@sendgrid/mail";
import { env } from "../config/env";

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

interface WelcomeEmailParams {
  to: string;
  firstName: string;
  userType: "candidate" | "vendor" | "admin";
}

interface SubscriptionEmailParams {
  to: string;
  firstName: string;
  plan: string;
  currentPeriodEnd: Date;
}

export async function sendWelcomeEmail({
  to,
  firstName,
  userType,
}: WelcomeEmailParams): Promise<void> {
  if (!env.SENDGRID_API_KEY) {
    console.log(`[SendGrid] (dev) Welcome email to ${to}`);
    return;
  }

  const roleText =
    userType === "vendor"
      ? "post jobs and find top candidates"
      : "discover job opportunities that match your profile";

  await sgMail.send({
    to,
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
    subject: "Welcome to MatchDB!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1d4479 0%, #3b6fa6 100%); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Match<span style="color: #a8cbf5;">DB</span></h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1d4479; margin-top: 0;">Welcome, ${firstName}!</h2>
          <p style="color: #444; line-height: 1.6;">
            Your account has been created. You can now ${roleText}.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${env.CLIENT_URL}" style="background: #3b6fa6; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Get Started
            </a>
          </div>
          <p style="color: #888; font-size: 12px;">If you did not create this account, please ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendSubscriptionActivatedEmail({
  to,
  firstName,
  plan,
  currentPeriodEnd,
}: SubscriptionEmailParams): Promise<void> {
  if (!env.SENDGRID_API_KEY) {
    console.log(`[SendGrid] (dev) Subscription email to ${to} — plan: ${plan}`);
    return;
  }

  await sgMail.send({
    to,
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
    subject: `Your MatchDB ${plan.toUpperCase()} plan is now active`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1d4479 0%, #3b6fa6 100%); padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Match<span style="color: #a8cbf5;">DB</span></h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1d4479; margin-top: 0;">Subscription Activated!</h2>
          <p style="color: #444; line-height: 1.6;">
            Hi ${firstName}, your <strong>${plan}</strong> plan is now active.
            Your next billing date is <strong>${currentPeriodEnd.toLocaleDateString()}</strong>.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${env.CLIENT_URL}/" style="background: #3b6fa6; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Manage Subscription
            </a>
          </div>
        </div>
      </div>
    `,
  });
}
