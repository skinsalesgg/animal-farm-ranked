import { useNavigate } from "react-router-dom";

import { tierStateToSubmissionPayload } from "../lib/aggregate";
import { createInitialTierState } from "../lists";
import type { TierBoardState } from "../lib/types";
import { rankingsApi } from "../api/rankings";
import { useTierListContext } from "../hooks/useTierListContext";

import { TierBoard } from "./TierBoard";

export function RankPageClient() {
  const { list } = useTierListContext();
  const navigate = useNavigate();

  async function handleSubmit(
    state: TierBoardState,
    displayName: string,
    honeypot: string,
  ) {
    const result = await rankingsApi.createSubmission(list.id, {
      displayName: displayName.trim(),
      website: honeypot,
      placements: tierStateToSubmissionPayload(state),
    });
    navigate(`/${list.slug}/r/${result.id}`);
  }

  return (
    <TierBoard
      initialState={createInitialTierState(list)}
      onSubmit={handleSubmit}
    />
  );
}
