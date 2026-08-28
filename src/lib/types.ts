export const TIERS = ["S", "A", "B", "C", "D", "E", "F"] as const;

export type Tier = (typeof TIERS)[number];

export type TierItem = {
  id: string;
  name: string;
  label: string;
  imageUrl: string;
  sortOrder: number;
};

export type TierPlacement = {
  submissionId: string;
  itemId: string;
  tier: Tier;
};

export type AggregatedItem = {
  item: TierItem;
  score: number;
  votes: number;
  communityTier: Tier;
};

export type TierBoardState = Record<Tier | "unranked", string[]>;
