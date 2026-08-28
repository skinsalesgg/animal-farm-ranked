import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { TierItem } from "../lib/types";

import { TierItemCard } from "./TierItemCard";

type SortableTierItemCardProps = {
  itemId: string;
  itemMap: Map<string, TierItem>;
  imageOnly?: boolean;
};

export function SortableTierItemCard({
  itemId,
  itemMap,
  imageOnly = false,
}: SortableTierItemCardProps) {
  const item = itemMap.get(itemId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId });

  if (!item) return null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TierItemCard
        item={item}
        imageOnly={imageOnly}
        draggable
        dragging={isDragging}
      />
    </div>
  );
}
