import type { Tier } from "./types";
import { TIERS } from "./types";

export const MAX_TIER_SCORE = TIERS.length;

/** Absolute tier weights used for community averages (S = best). */
export const TIER_SCORE: Record<Tier, number> = {
  S: 7,
  A: 6,
  B: 5,
  C: 4,
  D: 3,
  E: 2,
  F: 1,
};

export const TIER_COLORS: Record<Tier, string> = {
  S: "bg-red-500",
  A: "bg-orange-500",
  B: "bg-yellow-400 text-black",
  C: "bg-lime-400 text-black",
  D: "bg-sky-400 text-black",
  E: "bg-violet-400 text-black",
  F: "bg-zinc-500",
};

export function isValidTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

export function tierToScore(tier: Tier): number {
  return TIER_SCORE[tier];
}

/**
 * Map a 1–7 community mean score to S–F.
 * Scores come from averaging the tier labels voters actually chose.
 */
export function scoreToTier(score: number): Tier {
  if (score >= 6.5) return "S";
  if (score >= 5.5) return "A";
  if (score >= 4.5) return "B";
  if (score >= 3.5) return "C";
  if (score >= 2.5) return "D";
  if (score >= 1.5) return "E";
  return "F";
}

type ScoredItem = { id: string; score: number };

function nearestCentroidIndex(value: number, centroids: number[]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < centroids.length; index += 1) {
    const distance = Math.abs(value - centroids[index]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function initializeCentroids(values: number[], k: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const centroids: number[] = [];

  for (let index = 0; index < k; index += 1) {
    const position = Math.min(
      sorted.length - 1,
      Math.floor(((index + 0.5) / k) * sorted.length),
    );
    centroids.push(sorted[position] ?? sorted[sorted.length - 1]);
  }

  return centroids;
}

function kMeans1D(values: number[], k: number): number[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length <= k) {
    return [...values].sort((a, b) => b - a);
  }

  let centroids = initializeCentroids(values, k);

  for (let iteration = 0; iteration < 50; iteration += 1) {
    const groups = Array.from({ length: k }, () => [] as number[]);

    for (const value of values) {
      groups[nearestCentroidIndex(value, centroids)].push(value);
    }

    let changed = false;
    for (let index = 0; index < k; index += 1) {
      if (groups[index].length === 0) {
        const replacement = values.reduce((best, value) =>
          Math.abs(value - centroids[index]) > Math.abs(best - centroids[index])
            ? value
            : best,
        values[0]);
        if (replacement !== centroids[index]) {
          changed = true;
        }
        centroids[index] = replacement;
        continue;
      }

      const mean =
        groups[index].reduce((sum, value) => sum + value, 0) /
        groups[index].length;

      if (Math.abs(mean - centroids[index]) > 1e-9) {
        changed = true;
      }
      centroids[index] = mean;
    }

    if (!changed) {
      break;
    }
  }

  return centroids;
}

function sortCentroidsByScore(centroids: number[]) {
  return centroids
    .map((centroid, index) => ({ index, centroid }))
    .sort((a, b) => b.centroid - a.centroid || a.index - b.index);
}

/**
 * Cluster community mean scores (S=7 … F=1) with k-means (k=7), then label
 * each cluster S–F from highest to lowest centroid.
 */
export function assignCommunityTiersByScoreClustering(
  items: ScoredItem[],
): Map<string, Tier> {
  const tiers = new Map<string, Tier>();
  const scored = items.filter((item) => item.score > 0);

  if (scored.length === 0) {
    return tiers;
  }

  if (scored.length === 1) {
    tiers.set(scored[0].id, "S");
    return tiers;
  }

  if (scored.length <= 3) {
    for (const item of scored) {
      tiers.set(item.id, scoreToTier(item.score));
    }
    return tiers;
  }

  const clusterCount = Math.min(TIERS.length, scored.length);
  const values = scored.map((item) => item.score);
  const centroids = kMeans1D(values, clusterCount);
  const ranked = sortCentroidsByScore(centroids);
  const tierByCluster = new Map(
    ranked.map((entry, rank) => [entry.index, TIERS[rank] ?? "F"]),
  );

  for (const item of scored) {
    const clusterIndex = nearestCentroidIndex(item.score, centroids);
    tiers.set(item.id, tierByCluster.get(clusterIndex) ?? "F");
  }

  return tiers;
}

/**
 * Map a user's used tiers onto a 1–7 scale based on relative rank, not absolute label.
 * Used when comparing lists that skip tiers; not used for community aggregation.
 */
export function normalizedScoresForSubmission(
  placements: { tier: string; itemId: string }[],
): Map<string, number> {
  const validPlacements = placements.filter((p) => isValidTier(p.tier));
  const usedTiers = TIERS.filter((tier) =>
    validPlacements.some((placement) => placement.tier === tier),
  );

  const scores = new Map<string, number>();
  if (usedTiers.length === 0) return scores;

  const scoreByTier = new Map<Tier, number>();

  if (usedTiers.length === 1) {
    scoreByTier.set(usedTiers[0], (MAX_TIER_SCORE + 1) / 2);
  } else {
    usedTiers.forEach((tier, index) => {
      const score =
        MAX_TIER_SCORE - (index / (usedTiers.length - 1)) * (MAX_TIER_SCORE - 1);
      scoreByTier.set(tier, score);
    });
  }

  for (const placement of validPlacements) {
    const score = scoreByTier.get(placement.tier as Tier);
    if (score !== undefined) {
      scores.set(placement.itemId, score);
    }
  }

  return scores;
}
