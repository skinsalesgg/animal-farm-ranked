import { TIER_LISTS } from "../src/lists";
import { client, migrateDatabase } from "../server/db";

async function main() {
  await migrateDatabase();

  for (const list of TIER_LISTS) {
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

    console.log(`Seeded ${list.items.length} items for ${list.name}.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
