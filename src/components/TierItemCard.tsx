import type { TierItem } from "../lib/types";

type TierItemCardProps = {
  item: TierItem;
  showMeta?: boolean;
  imageOnly?: boolean;
  score?: number;
  votes?: number;
  draggable?: boolean;
  dragging?: boolean;
};

export function TierItemCard({
  item,
  showMeta = false,
  imageOnly = false,
  score,
  votes,
  draggable = false,
  dragging = false,
}: TierItemCardProps) {
  const tooltip =
    typeof score === "number" && typeof votes === "number"
      ? `${item.label} · ${score.toFixed(2)} · ${votes} vote${votes === 1 ? "" : "s"}`
      : item.label;

  return (
    <div
      className={`tier-item-card${imageOnly ? " tier-item-card--image-only" : ""}${dragging ? " is-dragging" : ""}`}
      title={tooltip}
      data-draggable={draggable ? "true" : undefined}
    >
      <div className="tier-item-image-wrap">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="tier-item-image"
          draggable={false}
        />
      </div>
      {!imageOnly ? (
        showMeta ? (
          <>
            <p className="tier-item-name">{item.label}</p>
            {typeof score === "number" && typeof votes === "number" ? (
              <p className="tier-item-meta">
                {score.toFixed(2)} · {votes} vote{votes === 1 ? "" : "s"}
              </p>
            ) : null}
          </>
        ) : (
          <p className="tier-item-name">{item.label}</p>
        )
      ) : null}
    </div>
  );
}

export function TierDragPreview({ item }: { item: TierItem }) {
  return (
    <div className="tier-drag-preview" aria-hidden="true">
      <img
        src={item.imageUrl}
        alt=""
        className="tier-drag-preview-image"
        draggable={false}
      />
    </div>
  );
}

export function TierItemCardById({
  itemId,
  itemMap,
  ...props
}: Omit<TierItemCardProps, "item"> & {
  itemId: string;
  itemMap: Map<string, TierItem>;
}) {
  const item = itemMap.get(itemId);
  if (!item) return null;
  return <TierItemCard item={item} {...props} />;
}
