import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) throw new Error("SESSION_SECRET env var is not set");
const encodedKey = new TextEncoder().encode(secretKey);

const SESSION_COOKIE = "session";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_TOKEN_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionPayload extends Record<string, unknown> {
  userId: string;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(encodedKey);
}

async function decrypt(session: string | undefined) {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Creates a fresh access token + refresh token pair on login. The refresh token replaces any previous one, so logging in on a new device signs other devices out. */
export async function createSession(userId: string) {
  const accessToken = await encrypt({ userId });
  const refreshToken = randomBytes(32).toString("hex");
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DURATION_MS);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: hashToken(refreshToken), refreshTokenExpiry: refreshExpiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + ACCESS_TOKEN_DURATION_MS),
  });
  cookieStore.set(REFRESH_COOKIE, refreshToken, { ...cookieOptions, expires: refreshExpiresAt });
}

export async function getSession() {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function getSessionFromToken(token: string | undefined) {
  return decrypt(token);
}

/**
 * Exchanges a refresh token cookie for a new access token, without rotating the refresh
 * token itself (rotating on every use races concurrent requests from the same browser).
 * Returns the new access token + its expiry so the caller (proxy) can set cookies on
 * both the outgoing response and the in-flight request.
 */
export async function refreshAccessToken(refreshToken: string | undefined) {
  if (!refreshToken) return null;

  const user = await prisma.user.findUnique({ where: { refreshTokenHash: hashToken(refreshToken) } });
  if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) return null;

  const accessToken = await encrypt({ userId: user.id });
  return { userId: user.id, accessToken, expiresAt: new Date(Date.now() + ACCESS_TOKEN_DURATION_MS) };
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const REFRESH_COOKIE_NAME = REFRESH_COOKIE;
export const ACCESS_TOKEN_COOKIE_OPTIONS = cookieOptions;

export async function deleteSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    // Revoke by hash match so logout works even after the short-lived access token has expired.
    await prisma.user.updateMany({
      where: { refreshTokenHash: hashToken(refreshToken) },
      data: { refreshTokenHash: null, refreshTokenExpiry: null },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}
