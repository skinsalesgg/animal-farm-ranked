import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { adminApi } from "../api/admin";
import { rankingsApi } from "../api/rankings";
import { TierBoard } from "../components/TierBoard";
import { PageMeta } from "../components/PageMeta";
import { placementsToTierState, tierStateToSubmissionPayload } from "../lib/aggregate";
import type { TierBoardState } from "../lib/types";
import { useTierListContext } from "../hooks/useTierListContext";

export default function AdminEditPage() {
  const { list, itemMap } = useTierListContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialState, setInitialState] = useState<TierBoardState | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const session = await adminApi.getSession();
        if (!session.authenticated) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const submission = await rankingsApi.getSubmission(list.id, id!);
        if (cancelled) return;

        const tierState = placementsToTierState(submission.placements, itemMap);
        setInitialState({ ...tierState, unranked: [] });
        setDisplayName(submission.displayName?.trim() ?? "");
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load submission.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, itemMap, list.id, navigate]);

  const pageTitle = useMemo(
    () => (displayName.trim() ? `${displayName.trim()} · Edit` : "Edit submission"),
    [displayName],
  );

  async function handleSave(
    state: TierBoardState,
    nextDisplayName: string,
  ) {
    if (!id) return;

    await rankingsApi.updateSubmission(list.id, id, {
      displayName: nextDisplayName.trim(),
      placements: tierStateToSubmissionPayload(state),
    });
    setDisplayName(nextDisplayName.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="tier-page tier-page--rank admin-page admin-edit">
      <PageMeta title={`${pageTitle} · ${list.name}`} />
      <header className="tier-page-header">
        <div className="tier-page-header-copy">
          <p className="tier-eyebrow">Admin edit</p>
          <h1 className="tier-page-title">{displayName.trim() || "Anonymous"}</h1>
          <p className="tier-meta tier-page-submeta">
            Drag stickers to update this submission. Community rankings update
            automatically.
          </p>
        </div>
        <div className="tier-page-header-actions">
          {saved ? <span className="tier-meta">Saved</span> : null}
          <Link
            to={`/admin/${list.slug}`}
            className="tier-btn tier-btn-ghost tier-page-cta"
          >
            Back to list
          </Link>
          {id ? (
            <Link
              to={`/${list.slug}/r/${id}`}
              className="tier-link admin-edit-view-link"
            >
              View live
            </Link>
          ) : null}
        </div>
      </header>

      {loading ? <p className="tier-meta">Loading tier list…</p> : null}
      {error ? <p className="tier-error">{error}</p> : null}

      {!loading && !error && initialState ? (
        <TierBoard
          key={id}
          initialState={initialState}
          initialDisplayName={displayName}
          submitLabel="Save changes"
          showHoneypot={false}
          onSubmit={async (state, nextDisplayName, _honeypot) => {
            void _honeypot;
            await handleSave(state, nextDisplayName);
          }}
        />
      ) : null}
    </div>
  );
}
