import { migrateDatabase } from "../server/db";

async function main() {
  await migrateDatabase();
  console.log("Database migrated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
