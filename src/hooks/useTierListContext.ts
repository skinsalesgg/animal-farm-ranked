import { createContext, useContext } from "react";

import type { TierListDefinition } from "../lists/types";
import { getItemMap } from "../lists";

type TierListContextValue = {
  list: TierListDefinition;
  itemMap: Map<string, TierListDefinition["items"][number]>;
};

export const TierListContext = createContext<TierListContextValue | null>(null);

export function useTierListContext() {
  const context = useContext(TierListContext);
  if (!context) {
    throw new Error("useTierListContext must be used within TierListLayout");
  }
  return context;
}

export function createTierListContextValue(
  list: TierListDefinition,
): TierListContextValue {
  return {
    list,
    itemMap: getItemMap(list),
  };
}
