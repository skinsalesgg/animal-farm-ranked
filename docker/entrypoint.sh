#!/bin/sh
set -e

if [ -z "$TURSO_DATABASE_URL" ]; then
  db_dir=$(dirname "${DATABASE_PATH:-data/ranked.db}")
  mkdir -p "$db_dir"
fi

echo "Running database migrations..."
npx tsx scripts/migrate.ts

if [ "${SEED_ON_START:-1}" != "0" ]; then
  echo "Seeding tier list catalog..."
  npx tsx scripts/seed.ts
fi

echo "Starting Animal Farm Ranked API..."
exec npx tsx server/index.ts
