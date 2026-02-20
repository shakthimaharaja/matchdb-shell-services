import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env';
import { prisma } from './prisma';

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
export const googleOAuthEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

if (googleOAuthEnabled) passport.use(
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
          return done(new Error('Google account has no associated email address.'));
        }

        // 1. Returning Google OAuth user — find by googleId
        const existingByGoogleId = await prisma.user.findUnique({
          where: { googleId: profile.id },
          include: { subscription: true },
        });
        if (existingByGoogleId) {
          return done(null, existingByGoogleId);
        }

        // 2. Existing email/password user — link Google account
        const existingByEmail = await prisma.user.findUnique({
          where: { email },
          include: { subscription: true },
        });
        if (existingByEmail) {
          if (!existingByEmail.isActive) {
            return done(new Error('Account is deactivated.'));
          }
          const linked = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: { googleId: profile.id },
            include: { subscription: true },
          });
          return done(null, linked);
        }

        // 3. New user via Google OAuth
        // userType is encoded in the state param as "candidate:nonce" or "vendor:nonce"
        const stateParam = (req.query.state as string) || '';
        const userType = stateParam.startsWith('vendor') ? 'vendor' : 'candidate';

        const newUser = await prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            // password is null — Google OAuth users have no password
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            userType,
            hasPurchasedVisibility: false,
            isActive: true,
            subscription: {
              create: {
                plan: 'free',
                status: 'active',
              },
            },
          },
          include: { subscription: true },
        });

        return done(null, newUser);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

export default passport;
