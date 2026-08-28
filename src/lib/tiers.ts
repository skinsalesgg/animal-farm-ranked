import type { Tier } from "./types";
import { TIERS } from "./types";

export const MAX_TIER_SCORE = TIERS.length;

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

export function scoreToTier(score: number): Tier {
  if (score >= 6.5) return "S";
  if (score >= 5.5) return "A";
  if (score >= 4.5) return "B";
  if (score >= 3.5) return "C";
  if (score >= 2.5) return "D";
  if (score >= 1.5) return "E";
  return "F";
}

/** Map a user's used tiers onto a 1–7 scale based on relative rank, not absolute label. */
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
