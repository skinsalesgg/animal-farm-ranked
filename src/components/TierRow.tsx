import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import type { Tier, TierItem } from "../lib/types";

import { SortableTierItemCard } from "./SortableTierItemCard";

type TierRowProps = {
  tier: Tier;
  itemIds: string[];
  itemMap: Map<string, TierItem>;
};

export function TierRow({ tier, itemIds, itemMap }: TierRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: tier });

  return (
    <div className={`tier-row${isOver ? " is-over" : ""}`}>
      <div className={`tier-label tier-label--${tier.toLowerCase()}`}>
        {tier}
      </div>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div ref={setNodeRef} className="tier-dropzone">
          {itemIds.length > 0 ? (
            itemIds.map((itemId) => (
              <SortableTierItemCard
                key={itemId}
                itemId={itemId}
                itemMap={itemMap}
                imageOnly
              />
            ))
          ) : (
            <div className="tier-placeholder">Drop items here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
