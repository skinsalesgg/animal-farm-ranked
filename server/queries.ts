import { TIER_LISTS, getTierListById } from "../src/lists";
import { aggregatePlacements } from "../src/lib/aggregate";
import { isValidTier } from "../src/lib/tiers";
import type { Tier, TierPlacement } from "../src/lib/types";
import { client, migrateDatabase } from "./db";

let migrated = false;

async function ensureMigrated() {
  if (!migrated) {
    await migrateDatabase();
    migrated = true;
  }
}

export async function ensureListItemsSeeded(listId: string) {
  await ensureMigrated();

  const list = getTierListById(listId);
  if (!list) {
    throw new Error(`Unknown tier list: ${listId}`);
  }

  for (const item of list.items) {
    await client.execute({
      sql: `INSERT INTO tier_items (list_id, id, name, label, image_url, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(list_id, id) DO UPDATE SET
              name = excluded.name,
              label = excluded.label,
              image_url = excluded.image_url,
              sort_order = excluded.sort_order`,
      args: [
        list.id,
        item.id,
        item.name,
        item.label,
        item.imageUrl,
        item.sortOrder,
      ],
    });
  }
}

export async function ensureAllListsSeeded() {
  for (const list of TIER_LISTS) {
    await ensureListItemsSeeded(list.id);
  }
}

export async function getAllPlacements(listId: string): Promise<TierPlacement[]> {
  await ensureListItemsSeeded(listId);

  const result = await client.execute({
    sql: "SELECT submission_id, item_id, tier FROM placements WHERE list_id = ?",
    args: [listId],
  });

  return result.rows
    .map((row) => ({
      submissionId: String(row.submission_id),
      itemId: String(row.item_id),
      tier: String(row.tier),
    }))
    .filter((row) => isValidTier(row.tier))
    .map((row) => ({
      submissionId: row.submissionId,
      itemId: row.itemId,
      tier: row.tier as Tier,
    }));
}

export async function getSubmissionCount(listId: string) {
  await ensureListItemsSeeded(listId);
  const result = await client.execute({
    sql: "SELECT COUNT(*) AS count FROM submissions WHERE list_id = ?",
    args: [listId],
  });
  return Number(result.rows[0]?.count ?? 0);
}

export async function listRecentSubmissions(listId: string, limit = 20) {
  await ensureListItemsSeeded(listId);

  const result = await client.execute({
    sql: `SELECT id, display_name, created_at
          FROM submissions
          WHERE list_id = ?
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [listId, limit],
  });

  return result.rows.map((row) => {
    const createdAt = Number(row.created_at);
    return {
      id: String(row.id),
      displayName:
        row.display_name != null ? String(row.display_name) : null,
      createdAt: new Date(
        createdAt > 1_000_000_000_000 ? createdAt : createdAt * 1000,
      ).toISOString(),
    };
  });
}

export async function getSubmissionById(listId: string, id: string) {
  await ensureListItemsSeeded(listId);

  const submissionResult = await client.execute({
    sql: "SELECT id, list_id, display_name, created_at FROM submissions WHERE id = ? AND list_id = ? LIMIT 1",
    args: [id, listId],
  });

  const submission = submissionResult.rows[0];
  if (!submission) return null;

  const placementsResult = await client.execute({
    sql: "SELECT item_id, tier FROM placements WHERE submission_id = ? AND list_id = ?",
    args: [id, listId],
  });

  const createdAt = Number(submission.created_at);

  return {
    id: String(submission.id),
    listId: String(submission.list_id),
    displayName:
      submission.display_name != null ? String(submission.display_name) : null,
    createdAt: new Date(
      createdAt > 1_000_000_000_000 ? createdAt : createdAt * 1000,
    ),
    placements: placementsResult.rows
      .map((row) => ({
        itemId: String(row.item_id),
        tier: String(row.tier),
      }))
      .filter((row) => isValidTier(row.tier))
      .map((row) => ({
        itemId: row.itemId,
        tier: row.tier as Tier,
      })),
  };
}

export async function getCommunityData(listId: string) {
  const list = getTierListById(listId);
  if (!list) {
    throw new Error(`Unknown tier list: ${listId}`);
  }

  const allPlacements = await getAllPlacements(listId);
  return {
    submissionCount: await getSubmissionCount(listId),
    aggregated: aggregatePlacements(allPlacements, list.items),
  };
}

export async function createSubmission(input: {
  listId: string;
  sessionId: string;
  displayName: string | null;
  placements: Array<{ itemId: string; tier: Tier }>;
}) {
  await ensureListItemsSeeded(input.listId);

  const { nanoid } = await import("nanoid");
  const submissionId = nanoid();
  const createdAt = Date.now();

  await client.execute({
    sql: `INSERT INTO submissions (id, list_id, display_name, session_id, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      submissionId,
      input.listId,
      input.displayName,
      input.sessionId,
      createdAt,
    ],
  });

  for (const placement of input.placements) {
    await client.execute({
      sql: `INSERT INTO placements (submission_id, list_id, item_id, tier, rank_in_tier)
            VALUES (?, ?, ?, ?, 0)`,
      args: [
        submissionId,
        input.listId,
        placement.itemId,
        placement.tier,
      ],
    });
  }

  return { id: submissionId };
}
