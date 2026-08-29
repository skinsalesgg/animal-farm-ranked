import {
  assignCommunityTiersByScoreClustering,
  isValidTier,
  tierToScore,
} from "./tiers";
import type { AggregatedItem, Tier, TierItem, TierPlacement } from "./types";
import { TIERS } from "./types";

export function aggregatePlacements(
  placements: TierPlacement[],
  items: TierItem[],
): AggregatedItem[] {
  const bySubmission = new Map<string, TierPlacement[]>();

  for (const placement of placements) {
    const group = bySubmission.get(placement.submissionId) ?? [];
    group.push(placement);
    bySubmission.set(placement.submissionId, group);
  }

  const totals = new Map<string, { scoreSum: number; votes: number }>();

  for (const submissionPlacements of bySubmission.values()) {
    for (const placement of submissionPlacements) {
      if (!isValidTier(placement.tier)) continue;

      const score = tierToScore(placement.tier);
      const current = totals.get(placement.itemId) ?? { scoreSum: 0, votes: 0 };
      current.scoreSum += score;
      current.votes += 1;
      totals.set(placement.itemId, current);
    }
  }

  const aggregated = items.map((item) => {
    const stats = totals.get(item.id);
    const score = stats ? stats.scoreSum / stats.votes : 0;
    const votes = stats?.votes ?? 0;

    return {
      item,
      score,
      votes,
      communityTier: "F" as Tier,
    };
  });

  const tierAssignments = assignCommunityTiersByScoreClustering(
    aggregated
      .filter((entry) => entry.votes > 0)
      .map((entry) => ({ id: entry.item.id, score: entry.score })),
  );

  for (const entry of aggregated) {
    if (entry.votes > 0) {
      entry.communityTier = tierAssignments.get(entry.item.id) ?? "F";
    }
  }

  aggregated.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.votes !== a.votes) return b.votes - a.votes;
    return a.item.name.localeCompare(b.item.name);
  });

  return aggregated;
}

export function groupByCommunityTier(
  aggregated: AggregatedItem[],
): Record<Tier, AggregatedItem[]> {
  const grouped = {} as Record<Tier, AggregatedItem[]>;
  for (const tier of TIERS) {
    grouped[tier] = [];
  }

  for (const entry of aggregated) {
    if (entry.votes > 0 && isValidTier(entry.communityTier)) {
      grouped[entry.communityTier].push(entry);
    }
  }

  return grouped;
}

export function placementsToTierState(
  placements: Array<{ tier: Tier; itemId: string }>,
  itemMap: Map<string, TierItem>,
): Record<Tier, string[]> {
  const state = Object.fromEntries(
    TIERS.map((tier) => [tier, [] as string[]]),
  ) as Record<Tier, string[]>;

  const sorted = [...placements].sort((a, b) => {
    if (a.tier !== b.tier) return TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier);
    const orderA = itemMap.get(a.itemId)?.sortOrder ?? 0;
    const orderB = itemMap.get(b.itemId)?.sortOrder ?? 0;
    return orderA - orderB;
  });

  for (const placement of sorted) {
    if (isValidTier(placement.tier)) {
      state[placement.tier].push(placement.itemId);
    }
  }

  return state;
}

export function tierStateToSubmissionPayload(
  state: Record<Tier | "unranked", string[]>,
): Array<{ itemId: string; tier: Tier }> {
  return TIERS.flatMap((tier) =>
    state[tier].map((itemId) => ({ itemId, tier })),
  );
}
