import { readFileSync } from "node:fs";

import { getItemMap, getTierListById } from "../src/lists";
import { isValidTier } from "../src/lib/tiers";
import type { Tier } from "../src/lib/types";
import {
  listRecentSubmissions,
  updateSubmissionPlacements,
} from "../server/queries";

type PlacementInput = { itemId: string; tier: Tier };

function usage() {
  console.log(`Usage:
  npm run db:update-submission -- --list kato-2014-holos --submission <id> --file placements.json
  npm run db:update-submission -- --list kato-2014-holos --submission <id> --tier titan_holo:S --tier ibuypower_holo:A
  npm run db:update-submission -- --list kato-2014-holos --list-submissions

Options:
  --list             Tier list id (default: kato-2014-holos)
  --submission       Submission id to update
  --name             Optional new display name
  --file             JSON file: [{ "itemId": "titan_holo", "tier": "S" }, ...]
  --tier             Repeatable itemId:tier pairs (e.g. titan_holo:S)
  --list-submissions Show recent submissions for the list
`);
}

function parseArgs(argv: string[]) {
  const options = {
    listId: "kato-2014-holos",
    submissionId: "",
    displayName: undefined as string | undefined,
    file: "",
    tiers: [] as PlacementInput[],
    listSubmissions: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--list":
        options.listId = argv[++i] ?? options.listId;
        break;
      case "--submission":
        options.submissionId = argv[++i] ?? "";
        break;
      case "--name":
        options.displayName = argv[++i] ?? "";
        break;
      case "--file":
        options.file = argv[++i] ?? "";
        break;
      case "--tier": {
        const pair = argv[++i] ?? "";
        const [itemId, tier] = pair.split(":");
        if (!itemId || !tier || !isValidTier(tier)) {
          throw new Error(`Invalid --tier value "${pair}". Use item_id:S format.`);
        }
        options.tiers.push({ itemId, tier });
        break;
      }
      case "--list-submissions":
        options.listSubmissions = true;
        break;
      case "--help":
      case "-h":
        usage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function loadPlacementsFromFile(path: string): PlacementInput[] {
  const raw = JSON.parse(readFileSync(path, "utf8")) as PlacementInput[];
  if (!Array.isArray(raw)) {
    throw new Error("Placements file must be a JSON array.");
  }
  for (const entry of raw) {
    if (!entry.itemId || !isValidTier(entry.tier)) {
      throw new Error(`Invalid placement entry: ${JSON.stringify(entry)}`);
    }
  }
  return raw;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const list = getTierListById(options.listId);

  if (!list) {
    throw new Error(`Unknown tier list: ${options.listId}`);
  }

  if (options.listSubmissions) {
    const submissions = await listRecentSubmissions(options.listId, 50);
    if (submissions.length === 0) {
      console.log("No submissions found.");
      return;
    }

    console.log(`Submissions for ${options.listId}:\n`);
    for (const submission of submissions) {
      const name = submission.displayName?.trim() || "(anonymous)";
      console.log(`${submission.id}  ${name}  ${submission.createdAt}`);
    }
    return;
  }

  if (!options.submissionId) {
    usage();
    process.exit(1);
  }

  const placements = options.file
    ? loadPlacementsFromFile(options.file)
    : options.tiers;

  if (placements.length === 0) {
    throw new Error("Provide --file or one or more --tier item_id:S arguments.");
  }

  const itemMap = getItemMap(list);
  const expected = itemMap.size;
  if (placements.length !== expected) {
    throw new Error(
      `Expected ${expected} placements for ${options.listId}, got ${placements.length}.`,
    );
  }

  const updated = await updateSubmissionPlacements({
    listId: options.listId,
    submissionId: options.submissionId,
    displayName: options.displayName,
    placements,
  });

  console.log(
    `Updated submission ${updated?.id} (${updated?.displayName ?? "anonymous"}) with ${placements.length} placements.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
