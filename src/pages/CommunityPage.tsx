import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { rankingsApi, type SubmissionSummary } from "../api/rankings";
import type { AggregatedItem } from "../lib/types";
import { PageMeta } from "../components/PageMeta";
import { CommunityTierList } from "../components/CommunityTierList";
import { RecentSubmissions } from "../components/RecentSubmissions";
import { useTierListContext } from "../hooks/useTierListContext";

export default function CommunityPage() {
  const { list } = useTierListContext();
  const [submissionCount, setSubmissionCount] = useState(0);
  const [aggregated, setAggregated] = useState<AggregatedItem[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<
    SubmissionSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      rankingsApi.getCommunity(list.id),
      rankingsApi.listSubmissions(list.id),
    ])
      .then(([community, submissionsList]) => {
        setSubmissionCount(community.submissionCount);
        setAggregated(community.aggregated);
        setRecentSubmissions(submissionsList.submissions);
      })
      .catch((fetchError) => {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load community rankings.",
        );
      })
      .finally(() => setLoading(false));
  }, [list.id]);

  return (
    <div className="tier-page tier-page--community">
      <PageMeta title={list.name} description={list.description} />
      <header className="tier-page-header tier-page-header--community">
        <div className="tier-page-header-copy">
          <h1 className="tier-page-title">{list.name}</h1>
          {!loading && !error && submissionCount > 0 ? (
            <p className="tier-meta tier-page-submeta">
              Based on {submissionCount} community ranking
              {submissionCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        <div className="tier-page-header-actions">
          <Link
            to={`/${list.slug}/rank`}
            className="tier-btn tier-btn-primary tier-page-cta"
          >
            Submit your tier list
          </Link>
        </div>
      </header>

      {loading ? <p className="tier-meta">Loading community rankings…</p> : null}
      {error ? <p className="tier-error">{error}</p> : null}
      {!loading && !error ? (
        <>
          <CommunityTierList
            aggregated={aggregated}
            submissionCount={submissionCount}
          />
          <RecentSubmissions
            listSlug={list.slug}
            submissions={recentSubmissions}
          />
        </>
      ) : null}
    </div>
  );
}
