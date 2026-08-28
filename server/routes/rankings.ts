import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { nanoid } from "nanoid";

import { getItemMap, getTierListById } from "../../src/lists";
import { isValidTier } from "../../src/lib/tiers";
import type { Tier } from "../../src/lib/types";
import {
  createSubmission,
  getCommunityData,
  getSubmissionById,
  listRecentSubmissions,
} from "../queries";

const SESSION_COOKIE = "afr_session";

export const rankingsRoutes = new Hono();

function getListId(c: { req: { param: (key: string) => string | undefined } }) {
  const listId = c.req.param("listId");
  if (!listId) {
    return null;
  }
  return listId;
}

rankingsRoutes.get("/community", async (c) => {
  const listId = getListId(c);
  if (!listId) {
    return c.json({ error: "Tier list not found." }, 404);
  }
  const list = getTierListById(listId);
  if (!list) {
    return c.json({ error: "Tier list not found." }, 404);
  }

  const data = await getCommunityData(listId);
  return c.json(data);
});

rankingsRoutes.get("/submissions", async (c) => {
  const listId = getListId(c);
  if (!listId) {
    return c.json({ error: "Tier list not found." }, 404);
  }
  const list = getTierListById(listId);
  if (!list) {
    return c.json({ error: "Tier list not found." }, 404);
  }

  const limit = Math.min(
    Math.max(Number(c.req.query("limit") ?? 20), 1),
    50,
  );
  const submissions = await listRecentSubmissions(listId, limit);
  return c.json({ submissions });
});

rankingsRoutes.get("/submissions/:id", async (c) => {
  const listId = getListId(c);
  if (!listId) {
    return c.json({ error: "Tier list not found." }, 404);
  }
  const list = getTierListById(listId);
  if (!list) {
    return c.json({ error: "Tier list not found." }, 404);
  }

  const submission = await getSubmissionById(listId, c.req.param("id"));
  if (!submission) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json({
    ...submission,
    createdAt: submission.createdAt.toISOString(),
  });
});

rankingsRoutes.post("/submissions", async (c) => {
  const listId = getListId(c);
  if (!listId) {
    return c.json({ error: "Tier list not found." }, 404);
  }
  const list = getTierListById(listId);
  if (!list) {
    return c.json({ error: "Tier list not found." }, 404);
  }

  const itemMap = getItemMap(list);

  const body = await c.req.json<{
    displayName?: string | null;
    website?: string;
    placements?: Array<{ itemId: string; tier: string }>;
  }>();

  if (body.website) {
    return c.json({ error: "Invalid submission." }, 400);
  }

  const displayName = body.displayName?.trim().slice(0, 40) ?? "";
  if (!displayName) {
    return c.json({ error: "Name is required." }, 400);
  }

  const placements = body.placements ?? [];
  if (placements.length !== itemMap.size) {
    return c.json({ error: "Every item must be placed in a tier." }, 400);
  }

  const seen = new Set<string>();
  for (const placement of placements) {
    if (!itemMap.has(placement.itemId)) {
      return c.json({ error: "Invalid item." }, 400);
    }
    if (!isValidTier(placement.tier)) {
      return c.json({ error: "Invalid tier." }, 400);
    }
    if (seen.has(placement.itemId)) {
      return c.json({ error: "Duplicate item placement." }, 400);
    }
    seen.add(placement.itemId);
  }

  let sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) {
    sessionId = nanoid();
  }

  const result = await createSubmission({
    listId,
    sessionId,
    displayName,
    placements: placements.map((placement) => ({
      itemId: placement.itemId,
      tier: placement.tier as Tier,
    })),
  });

  setCookie(c, SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return c.json(result);
});
