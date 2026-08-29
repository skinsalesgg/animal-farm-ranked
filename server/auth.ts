import { createHmac, timingSafeEqual } from "node:crypto";

import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context, MiddlewareHandler } from "hono";

export const ADMIN_COOKIE = "afr_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AdminCredentials = {
  username: string;
  password: string;
  secret: string;
};

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function getAdminCredentials(): AdminCredentials | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();

  if (!username || !password || !secret) {
    return null;
  }

  return { username, password, secret };
}

export function isAdminConfigured(): boolean {
  return getAdminCredentials() !== null;
}

function createSessionToken(secret: string): string {
  return createHmac("sha256", secret)
    .update("afr-admin-session-v1")
    .digest("hex");
}

export function verifyAdminLogin(username: string, password: string): boolean {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return false;
  }

  return (
    safeEqual(username, credentials.username) &&
    safeEqual(password, credentials.password)
  );
}

export function verifyAdminSession(token: string | undefined): boolean {
  const credentials = getAdminCredentials();
  if (!credentials || !token) {
    return false;
  }

  return safeEqual(token, createSessionToken(credentials.secret));
}

export function setAdminSessionCookie(c: Context): void {
  const credentials = getAdminCredentials();
  if (!credentials) {
    throw new Error("Admin credentials are not configured.");
  }

  setCookie(c, ADMIN_COOKIE, createSessionToken(credentials.secret), {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearAdminSessionCookie(c: Context): void {
  deleteCookie(c, ADMIN_COOKIE, { path: "/" });
}

export function requireAdmin(): MiddlewareHandler {
  return async (c, next) => {
    if (!isAdminConfigured()) {
      return c.json({ error: "Admin login is not configured." }, 503);
    }

    const token = getCookie(c, ADMIN_COOKIE);
    if (!verifyAdminSession(token)) {
      return c.json({ error: "Unauthorized." }, 401);
    }

    await next();
  };
}
