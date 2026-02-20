import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import passport from "passport";
import { prisma } from "../config/prisma";
import { googleOAuthEnabled } from "../config/passport";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/jwt.service";
import { sendWelcomeEmail } from "../services/sendgrid.service";
import { AppError } from "../middleware/error.middleware";
import { env } from "../config/env";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userType: z.enum(["candidate", "vendor"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Generates a URL-safe username slug from name parts + id suffix. */
function generateUsername(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  id: string,
): string {
  const clean = (s?: string | null) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = clean(firstName);
  const last  = clean(lastName);
  const suffix = id.replace(/-/g, "").slice(0, 6);
  if (first && last) return `${first}-${last}-${suffix}`;
  if (first || last)  return `${first || last}-${suffix}`;
  return `user-${suffix}`;
}

function makeTokens(
  user: { id: string; email: string; userType: string; username?: string | null },
  plan: string,
) {
  const access = signAccessToken({
    userId: user.id,
    email: user.email,
    userType: user.userType,
    plan,
    username: user.username || "",
  });
  const refresh = signRefreshToken({
    userId: user.id,
    tokenId: crypto.randomUUID(),
  });
  return { access, refresh };
}

async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}

function userResponse(
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    userType: string;
    username?: string | null;
    membershipConfig: string | null;
    hasPurchasedVisibility: boolean;
  },
  plan: string,
) {
  let membership_config: Record<string, string[]> | null = null;
  if (user.membershipConfig) {
    try {
      membership_config = JSON.parse(user.membershipConfig);
    } catch {
      /* ignore malformed JSON */
    }
  }
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName || "",
    last_name: user.lastName || "",
    user_type: user.userType,
    username: user.username || "",
    membership_config,
    has_purchased_visibility: user.hasPurchasedVisibility,
    plan,
  };
}

// ─── Email/Password Registration ──────────────────────────────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      const err: AppError = new Error("Email already registered");
      err.statusCode = 409;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);
    const newId = crypto.randomUUID();
    const username = generateUsername(body.firstName, body.lastName, newId);

    // Cast to any so TypeScript accepts `username` before `prisma generate` is re-run
    // after the schema migration. The column exists at runtime via `prisma db push`.
    const user = await (prisma.user as any).create({
      data: {
        id: newId,
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        userType: body.userType,
        username,
        hasPurchasedVisibility: false,
        subscription: {
          create: { plan: "free", status: "active" },
        },
      },
      include: { subscription: true },
    }) as { id: string; email: string; firstName: string | null; lastName: string | null;
             userType: string; username: string | null; membershipConfig: string | null;
             hasPurchasedVisibility: boolean; subscription: { plan: string } | null };

    const plan = user.subscription?.plan || "free";
    const { access, refresh } = makeTokens(user, plan);
    await storeRefreshToken(user.id, refresh);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      to: user.email,
      firstName: user.firstName || "there",
      userType: user.userType as "candidate" | "vendor",
    }).catch(console.error);

    res.status(201).json({
      user: userResponse(user, plan),
      access,
      refresh,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: err.errors[0]?.message || "Validation error",
        details: err.errors,
      });
      return;
    }
    next(err);
  }
}

// ─── Email/Password Login ─────────────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { subscription: true },
    });

    if (!user || !user.isActive) {
      const err: AppError = new Error("Invalid email or password");
      err.statusCode = 401;
      return next(err);
    }

    // Guard: Google OAuth users have no password
    if (!user.password) {
      const err: AppError = new Error(
        "This account uses Google sign-in. Please click 'Continue with Google' to log in.",
      );
      err.statusCode = 401;
      return next(err);
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordMatch) {
      const err: AppError = new Error("Invalid email or password");
      err.statusCode = 401;
      return next(err);
    }

    const plan = user.subscription?.plan || "free";
    const { access, refresh } = makeTokens(user, plan);
    await storeRefreshToken(user.id, refresh);

    res.json({
      user: userResponse(user, plan),
      access,
      refresh,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: err.errors[0]?.message || "Validation error" });
      return;
    }
    next(err);
  }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * GET /api/auth/google?userType=candidate|vendor
 * Initiates the Google OAuth flow. userType is threaded through state param.
 */
export function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!googleOAuthEnabled) {
    res.status(501).json({ error: "Google OAuth is not configured on this server." });
    return;
  }
  const userType = (req.query.userType as string) === "vendor" ? "vendor" : "candidate";
  // State encodes userType so the callback can read it; nonce prevents CSRF
  const state = `${userType}:${crypto.randomUUID()}`;

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    session: false,
  })(req, res, next);
}

/**
 * GET /api/auth/google/callback
 * Google redirects here after user approves. Issues JWT and redirects to frontend.
 */
export function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!googleOAuthEnabled) {
    return res.redirect(`${env.CLIENT_URL}/login?oauth_error=not_configured`) as any;
  }
  passport.authenticate(
    "google",
    { session: false },
    async (err: Error | null, user: any) => {
      if (err || !user) {
        const msg = err?.message || "Google authentication failed";
        console.error("[Google OAuth] Error:", msg);
        return res.redirect(
          `${env.CLIENT_URL}/login?oauth_error=${encodeURIComponent(msg)}`,
        );
      }

      try {
        const plan = user.subscription?.plan || "free";
        const { access, refresh } = makeTokens(user, plan);
        await storeRefreshToken(user.id, refresh);

        const userData = userResponse(user, plan);

        // Redirect to frontend OAuth callback page with tokens in query params.
        // The frontend reads and stores these in Redux + localStorage.
        const params = new URLSearchParams({
          token: access,
          refresh,
          user: JSON.stringify(userData),
        });

        res.redirect(`${env.CLIENT_URL}/oauth-callback?${params.toString()}`);
      } catch (tokenErr) {
        console.error("[Google OAuth] Token issuance error:", tokenErr);
        res.redirect(`${env.CLIENT_URL}/login?oauth_error=token_error`);
      }
    },
  )(req, res, next);
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refresh } = req.body as { refresh?: string };
    if (!refresh) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    const payload = verifyRefreshToken(refresh);

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refresh },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      res.status(401).json({ error: "Refresh token invalid or expired" });
      return;
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { subscription: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    const plan = user.subscription?.plan || "free";
    const newAccess = signAccessToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      plan,
      username: (user as any).username || "",
    });
    const newRefresh = signRefreshToken({
      userId: user.id,
      tokenId: crypto.randomUUID(),
    });
    await storeRefreshToken(user.id, newRefresh);

    res.json({ access: newAccess, refresh: newRefresh });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
}

// ─── Verify / Logout / Delete ─────────────────────────────────────────────────

export async function verify(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { subscription: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const plan = user.subscription?.plan || "free";
    res.json({ user: userResponse(user, plan) });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refresh } = req.body as { refresh?: string };
    if (refresh) {
      await prisma.refreshToken.updateMany({
        where: { token: refresh, revoked: false },
        data: { revoked: true },
      });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;

    // Cascade-delete removes Subscription, RefreshTokens, and CandidatePayments automatically
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Account deleted permanently" });
  } catch (err) {
    next(err);
  }
}
