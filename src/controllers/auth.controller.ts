import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/jwt.service";
import { sendWelcomeEmail } from "../services/sendgrid.service";
import { AppError } from "../middleware/error.middleware";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userType: z.enum(["candidate", "vendor"]),
  visibility: z.enum(["all", "c2c", "w2", "c2h", "fulltime"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function makeTokens(
  user: { id: string; email: string; userType: string },
  plan: string,
) {
  const access = signAccessToken({
    userId: user.id,
    email: user.email,
    userType: user.userType,
    plan,
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
    visibility: string;
  },
  plan: string,
) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName || "",
    last_name: user.lastName || "",
    user_type: user.userType,
    visibility: user.visibility || "all",
    plan,
  };
}

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

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        userType: body.userType,
        visibility: body.visibility || "all",
        subscription: {
          create: { plan: "free", status: "active" },
        },
      },
      include: { subscription: true },
    });

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
      res
        .status(400)
        .json({
          error: err.errors[0]?.message || "Validation error",
          details: err.errors,
        });
      return;
    }
    next(err);
  }
}

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
