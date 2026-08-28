import { placementsToTierState } from "../lib/aggregate";
import type { Tier } from "../lib/types";
import { TIERS } from "../lib/types";
import { useTierListContext } from "../hooks/useTierListContext";

import { TierItemCardById } from "./TierItemCard";

type PersonalTierListProps = {
  placements: Array<{ itemId: string; tier: Tier }>;
};

export function PersonalTierList({ placements }: PersonalTierListProps) {
  const { itemMap } = useTierListContext();
  const state = placementsToTierState(placements, itemMap);

  return (
    <div className="tier-board">
      {TIERS.map((tier) => (
        <div key={tier} className="tier-row">
          <div className={`tier-label tier-label--${tier.toLowerCase()}`}>
            {tier}
          </div>
          <div className="tier-dropzone">
            {state[tier].length > 0 ? (
              state[tier].map((itemId) => (
                <TierItemCardById
                  key={itemId}
                  itemId={itemId}
                  itemMap={itemMap}
                />
              ))
            ) : (
              <div className="tier-placeholder">Empty</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
