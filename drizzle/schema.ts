import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stickers = sqliteTable("stickers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  team: text("team").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  sessionId: text("session_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const placements = sqliteTable("placements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  stickerId: text("sticker_id")
    .notNull()
    .references(() => stickers.id),
  tier: text("tier").notNull(),
  rankInTier: integer("rank_in_tier").notNull(),
});
