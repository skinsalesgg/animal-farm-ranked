import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { rankingsApi } from "../api/rankings";
import type { Tier } from "../lib/types";
import { PageMeta } from "../components/PageMeta";
import { PersonalTierList } from "../components/PersonalTierList";
import { useTierListContext } from "../hooks/useTierListContext";

export default function SharePage() {
  const { list } = useTierListContext();
  const { id } = useParams<{ id: string }>();
  const [placements, setPlacements] = useState<
    Array<{ itemId: string; tier: Tier }>
  >([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    rankingsApi
      .getSubmission(list.id, id)
      .then((submission) => {
        setPlacements(submission.placements);
        setDisplayName(submission.displayName);
        setCreatedAt(new Date(submission.createdAt));
      })
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Ranking not found.",
        );
      })
      .finally(() => setLoading(false));
  }, [id, list.id]);

  const pageTitle = displayName?.trim() || "Anonymous";

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="tier-page tier-page--community tier-page--submission">
      <PageMeta title={`${pageTitle} · ${list.name}`} />
      <header className="tier-page-header tier-page-header--community">
        <div className="tier-page-header-copy">
          <h1 className="tier-page-title">{pageTitle}</h1>
          {createdAt ? (
            <p className="tier-meta tier-page-submeta">
              Submitted {createdAt.toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="tier-page-header-actions">
          <button
            type="button"
            onClick={handleCopyLink}
            className="tier-btn tier-btn-ghost tier-page-cta"
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      </header>

      {loading ? <p className="tier-meta">Loading tier list…</p> : null}
      {error ? <p className="tier-error">{error}</p> : null}
      {!loading && !error ? (
        <PersonalTierList placements={placements} />
      ) : null}

      <p className="tier-submission-footer">
        <Link to={`/${list.slug}`} className="tier-link">
          View community tier list
        </Link>
      </p>
    </div>
  );
}
