import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { adminApi } from "../api/admin";
import { rankingsApi, type SubmissionSummary } from "../api/rankings";
import { PageMeta } from "../components/PageMeta";
import { useTierListContext } from "../hooks/useTierListContext";

export default function AdminDashboardPage() {
  const { list } = useTierListContext();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const session = await adminApi.getSession();
        if (!session.authenticated) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const response = await rankingsApi.listSubmissions(list.id, 50);
        if (!cancelled) {
          setSubmissions(response.submissions);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load submissions.",
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
  }, [list.id, navigate]);

  async function handleLogout() {
    try {
      await adminApi.logout();
    } catch {
      // Cookie may already be cleared.
    }
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="tier-page admin-page admin-dashboard">
      <PageMeta title={`Admin · ${list.name}`} />
      <header className="tier-page-header tier-page-header--community">
        <div className="tier-page-header-copy">
          <p className="tier-eyebrow">Admin</p>
          <h1 className="tier-page-title">{list.name}</h1>
          <p className="tier-meta tier-page-submeta">
            Edit individual community submissions.
          </p>
        </div>
        <div className="tier-page-header-actions">
          <button
            type="button"
            onClick={handleLogout}
            className="tier-btn tier-btn-ghost tier-page-cta"
          >
            Sign out
          </button>
        </div>
      </header>

      {loading ? <p className="tier-meta">Loading submissions…</p> : null}
      {error ? <p className="tier-error">{error}</p> : null}

      {!loading && !error ? (
        <div className="admin-submission-list">
          {submissions.length === 0 ? (
            <p className="tier-meta">No submissions yet.</p>
          ) : (
            submissions.map((submission) => {
              const name = submission.displayName?.trim() || "Anonymous";
              return (
                <div key={submission.id} className="admin-submission-row">
                  <div className="admin-submission-copy">
                    <p className="admin-submission-name">{name}</p>
                    <p className="tier-meta">
                      {new Date(submission.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="admin-submission-actions">
                    <Link
                      to={`/admin/${list.slug}/r/${submission.id}`}
                      className="tier-btn tier-btn-ghost"
                    >
                      Edit tiers
                    </Link>
                    <Link
                      to={`/${list.slug}/r/${submission.id}`}
                      className="tier-link"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
