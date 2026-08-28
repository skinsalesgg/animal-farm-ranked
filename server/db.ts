import { createClient, type Client } from "@libsql/client";

const globalForDb = globalThis as unknown as {
  client?: Client;
};

function getClient() {
  // Default: local SQLite file (DATABASE_PATH). Optional: Turso for hosted libSQL.
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  const path = process.env.DATABASE_PATH ?? "data/ranked.db";
  return createClient({ url: `file:${path}` });
}

export const client = globalForDb.client ?? getClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

async function tableExists(name: string) {
  const result = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    args: [name],
  });
  return result.rows.length > 0;
}

async function columnExists(table: string, column: string) {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return result.rows.some((row) => String(row.name) === column);
}

export async function migrateDatabase() {
  await client.execute(`CREATE TABLE IF NOT EXISTS tier_items (
    list_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (list_id, id)
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    display_name TEXT,
    session_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    list_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    tier TEXT NOT NULL,
    rank_in_tier INTEGER NOT NULL DEFAULT 0
  )`);

  if (await tableExists("stickers")) {
    const hasListId = await columnExists("stickers", "list_id");
    if (!hasListId) {
      await client.execute(
        "ALTER TABLE stickers ADD COLUMN list_id TEXT DEFAULT 'kato-2014-holos'",
      );
    }

    await client.execute(`
      INSERT INTO tier_items (list_id, id, name, label, image_url, sort_order)
      SELECT
        COALESCE(list_id, 'kato-2014-holos'),
        id,
        name,
        team,
        image_url,
        sort_order
      FROM stickers
      ON CONFLICT(list_id, id) DO UPDATE SET
        name = excluded.name,
        label = excluded.label,
        image_url = excluded.image_url,
        sort_order = excluded.sort_order
    `);
  }

  if (await tableExists("submissions")) {
    if (!(await columnExists("submissions", "list_id"))) {
      await client.execute(
        "ALTER TABLE submissions ADD COLUMN list_id TEXT DEFAULT 'kato-2014-holos'",
      );
      await client.execute(
        "UPDATE submissions SET list_id = 'kato-2014-holos' WHERE list_id IS NULL",
      );
    }
  }

  if (await tableExists("placements") && !(await columnExists("placements", "list_id"))) {
    await client.execute(
      "ALTER TABLE placements ADD COLUMN list_id TEXT DEFAULT 'kato-2014-holos'",
    );
    await client.execute(
      "UPDATE placements SET list_id = 'kato-2014-holos' WHERE list_id IS NULL",
    );
  }

  if (
    (await tableExists("placements")) &&
    (await columnExists("placements", "sticker_id")) &&
    !(await columnExists("placements", "item_id"))
  ) {
    await client.execute("ALTER TABLE placements ADD COLUMN item_id TEXT");
    await client.execute("UPDATE placements SET item_id = sticker_id WHERE item_id IS NULL");
  }
}
