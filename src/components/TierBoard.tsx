import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";

import type { TierBoardState } from "../lib/types";
import { TIERS } from "../lib/types";
import { useTierListContext } from "../hooks/useTierListContext";

import { SortableTierItemCard } from "./SortableTierItemCard";
import { TierDragPreview } from "./TierItemCard";
import { TierRow } from "./TierRow";

const CONTAINER_IDS = [...TIERS, "unranked"] as const;
type ContainerId = (typeof CONTAINER_IDS)[number];

type TierBoardProps = {
  initialState: TierBoardState;
  onSubmit: (
    state: TierBoardState,
    displayName: string,
    honeypot: string,
  ) => Promise<void>;
};

function isContainerId(id: string): id is ContainerId {
  return CONTAINER_IDS.includes(id as ContainerId);
}

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

function findContainerInState(
  board: TierBoardState,
  id: string,
): ContainerId | null {
  if (isContainerId(id)) return id;
  for (const containerId of CONTAINER_IDS) {
    if (board[containerId].includes(id)) return containerId;
  }
  return null;
}

export function TierBoard({ initialState, onSubmit }: TierBoardProps) {
  const { list, itemMap } = useTierListContext();
  const [state, setState] = useState<TierBoardState>(initialState);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const unrankedCount = state.unranked.length;
  const canSubmit = unrankedCount === 0;
  const activeItem = activeId ? itemMap.get(activeId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);

    setState((current) => {
      const activeContainer = findContainerInState(current, activeItemId);
      const overContainer = findContainerInState(current, overId);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return current;
      }

      const next: TierBoardState = {
        S: [...current.S],
        A: [...current.A],
        B: [...current.B],
        C: [...current.C],
        D: [...current.D],
        E: [...current.E],
        F: [...current.F],
        unranked: [...current.unranked],
      };

      next[activeContainer] = next[activeContainer].filter(
        (id) => id !== activeItemId,
      );

      next[overContainer].push(activeItemId);

      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    void event;
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setError("Place every item in a tier before submitting.");
      return;
    }

    if (!displayName.trim()) {
      setError("Enter your name before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(state, displayName, honeypot);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit ranking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="tier-rank-layout">
        <div className="tier-board">
          {TIERS.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              itemIds={state[tier]}
              itemMap={itemMap}
            />
          ))}
        </div>

        <aside className="tier-rank-sidebar">
          <UnrankedPool
            itemIds={state.unranked}
            itemMap={itemMap}
            copy={list.unrankedCopy(state.unranked.length, list.items.length)}
          />

          <div className="tier-submit-panel">
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
              className="tier-honeypot"
            />

            {error ? <p className="tier-error">{error}</p> : null}

            <label className="tier-name-field">
              <span className="tier-name-label">
                Your name
                <span className="tier-required" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="e.g. goodvibes"
                maxLength={40}
                required
                className="tier-name-input"
                autoComplete="name"
              />
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting || !displayName.trim()}
              className="tier-btn tier-btn-primary"
            >
              {submitting ? "Submitting..." : "Submit tier list"}
            </button>
          </div>
        </aside>
      </div>

      <DragOverlay dropAnimation={null} className="tier-drag-overlay">
        {activeItem ? <TierDragPreview item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function UnrankedPool({
  itemIds,
  itemMap,
  copy,
}: {
  itemIds: string[];
  itemMap: Map<string, import("../lib/types").TierItem>;
  copy: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unranked" });

  return (
    <div className={`tier-unranked-panel${isOver ? " is-over" : ""}`}>
      <div className="tier-unranked-header">
        <h2 className="tier-unranked-title">Unranked</h2>
        <p className="tier-unranked-copy">{copy}</p>
      </div>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div ref={setNodeRef} className="tier-unranked-grid">
          {itemIds.map((itemId) => (
            <SortableTierItemCard
              key={itemId}
              itemId={itemId}
              itemMap={itemMap}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
