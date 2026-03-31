import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "node:crypto";
import { env } from "./env";
import { User, Subscription } from "../models";

/** Generate a URL-safe username slug from an OAuth profile name. */
function generateUsername(
  givenName?: string | null,
  familyName?: string | null,
): string {
  const cleanStr = (s?: string | null) =>
    (s ?? "").toLowerCase().replaceAll(/[^a-z0-9]/g, "");
  const first = cleanStr(givenName);
  const last = cleanStr(familyName);
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  if (first && last) return `${first}-${last}-${suffix}`;
  if (first || last) return `${first || last}-${suffix}`;
  return `user-${suffix}`;
}

/**
 * Registers the Google OAuth2 strategy with Passport.
 * Strategy is stateless — no session serialization needed.
 *
 * Flow:
 *  1. User is found by googleId → return existing user (returning OAuth user)
 *  2. User is found by email → link googleId to existing account (account linking)
 *  3. No match → create new user with userType from state param
 *
 * NOTE: Strategy is only registered when GOOGLE_CLIENT_ID is configured.
 * Without credentials the server still starts; OAuth routes return 501.
 */
export const googleOAuthEnabled = !!(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
);

if (googleOAuthEnabled)
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(
              new Error("Google account has no associated email address."),
            );
          }

          // 1. Returning Google OAuth user — find by googleId
          const existingByGoogleId = await User.findOne({
            googleId: profile.id,
          });
          if (existingByGoogleId) {
            const sub = await Subscription.findOne({
              userId: existingByGoogleId._id,
            });
            const userObj = existingByGoogleId.toObject();
            (userObj as any).subscription = sub ? sub.toObject() : null;
            return done(null, userObj as any);
          }

          // 2. Existing email/password user — link Google account
          const existingByEmail = await User.findOne({ email });
          if (existingByEmail) {
            if (!existingByEmail.isActive) {
              return done(new Error("Account is deactivated."));
            }
            existingByEmail.googleId = profile.id;
            await existingByEmail.save();
            const sub = await Subscription.findOne({
              userId: existingByEmail._id,
            });
            const userObj = existingByEmail.toObject();
            (userObj as any).subscription = sub ? sub.toObject() : null;
            return done(null, userObj as any);
          }

          // 3. New user via Google OAuth
          // userType is encoded in the state param as "candidate:nonce" or "employer:nonce"
          const stateParam = (req.query.state as string) || "";
          const userType = stateParam.startsWith("employer")
            ? "employer"
            : "candidate";

          // Generate URL-safe username slug
          const newId = crypto.randomUUID();
          const username = generateUsername(
            profile.name?.givenName,
            profile.name?.familyName,
          );

          const newUser = await User.create({
            _id: newId,
            email,
            googleId: profile.id,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            userType,
            username,
            hasPurchasedVisibility: false,
            isActive: true,
          });

          await Subscription.create({
            userId: newUser._id,
            plan: "free",
            status: "active",
          });

          const sub = await Subscription.findOne({ userId: newUser._id });
          const userObj = newUser.toObject();
          (userObj as any).subscription = sub ? sub.toObject() : null;

          return done(null, userObj as any);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );

export default passport;
