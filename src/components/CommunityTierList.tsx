import { groupByCommunityTier } from "../lib/aggregate";
import type { AggregatedItem } from "../lib/types";
import { TIERS } from "../lib/types";

import { TierItemCard } from "./TierItemCard";

type CommunityTierListProps = {
  aggregated: AggregatedItem[];
  submissionCount: number;
};

export function CommunityTierList({
  aggregated,
  submissionCount,
}: CommunityTierListProps) {
  const grouped = groupByCommunityTier(aggregated);

  if (submissionCount === 0) {
    return (
      <div className="tier-empty">
        <p className="tier-empty-title">No rankings yet</p>
        <p className="tier-empty-copy">Be the first to submit a tier list.</p>
      </div>
    );
  }

  return (
    <div className="tier-board">
      {TIERS.map((tier) => (
        <div key={tier} className="tier-row">
          <div className={`tier-label tier-label--${tier.toLowerCase()}`}>
            {tier}
          </div>
          <div className="tier-dropzone">
            {grouped[tier].length > 0 ? (
              grouped[tier].map((entry) => (
                <TierItemCard
                  key={entry.item.id}
                  item={entry.item}
                  showMeta
                  score={entry.score}
                  votes={entry.votes}
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
