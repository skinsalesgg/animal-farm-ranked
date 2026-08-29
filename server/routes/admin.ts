import { Hono } from "hono";
import { getCookie } from "hono/cookie";

import {
  ADMIN_COOKIE,
  clearAdminSessionCookie,
  isAdminConfigured,
  setAdminSessionCookie,
  verifyAdminLogin,
  verifyAdminSession,
} from "../auth";

export const adminRoutes = new Hono();

adminRoutes.get("/session", (c) => {
  if (!isAdminConfigured()) {
    return c.json({ configured: false, authenticated: false });
  }

  const token = getCookie(c, ADMIN_COOKIE);
  return c.json({
    configured: true,
    authenticated: verifyAdminSession(token),
  });
});

adminRoutes.post("/login", async (c) => {
  if (!isAdminConfigured()) {
    return c.json({ error: "Admin login is not configured." }, 503);
  }

  const body = await c.req.json<{ username?: string; password?: string }>();
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return c.json({ error: "Username and password are required." }, 400);
  }

  if (!verifyAdminLogin(username, password)) {
    return c.json({ error: "Invalid username or password." }, 401);
  }

  setAdminSessionCookie(c);
  return c.json({ ok: true });
});

adminRoutes.post("/logout", (c) => {
  clearAdminSessionCookie(c);
  return c.json({ ok: true });
});
