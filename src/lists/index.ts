import kato2014Holos from "./kato-2014-holos";
import type { TierListDefinition, TierListItem } from "./types";

/** Add new tier list modules here. */
export const TIER_LISTS: TierListDefinition[] = [kato2014Holos];

const byId = new Map(TIER_LISTS.map((list) => [list.id, list]));
const bySlug = new Map(TIER_LISTS.map((list) => [list.slug, list]));

export function getTierListById(id: string): TierListDefinition | undefined {
  return byId.get(id);
}

export function getTierListBySlug(
  slug: string,
): TierListDefinition | undefined {
  return bySlug.get(slug);
}

export function getItemMap(
  list: TierListDefinition,
): Map<string, TierListItem> {
  return new Map(list.items.map((item) => [item.id, item]));
}

export function createInitialTierState(list: TierListDefinition) {
  return {
    S: [] as string[],
    A: [] as string[],
    B: [] as string[],
    C: [] as string[],
    D: [] as string[],
    E: [] as string[],
    F: [] as string[],
    unranked: list.items.map((item) => item.id),
  };
}
