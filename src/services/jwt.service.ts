import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  userType: string;
  plan: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    payload,
    env.JWT_SECRET as Secret,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES,
    } as SignOptions,
  );
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET as Secret,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES,
    } as SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
