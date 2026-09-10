import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { adminApi } from "../api/admin";
import { PageMeta } from "../components/PageMeta";
import { TIER_LISTS } from "../lists";

export default function AdminIndexPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getSession()
      .then((session) => {
        if (!session.configured) {
          setError("Admin login is not configured on the API.");
          return;
        }
        if (!session.authenticated) {
          navigate("/admin/login", { replace: true });
        }
      })
      .catch(() => {
        setError("Could not reach the API.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleLogout() {
    try {
      await adminApi.logout();
    } catch {
      // Cookie may already be cleared.
    }
    navigate("/admin/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="admin-page">
        <p className="tier-meta">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageMeta title="Admin" description="Manage community tier list submissions." />
      <header className="admin-index-header">
        <div>
          <p className="tier-eyebrow">Admin</p>
          <h1 className="admin-title">Tier lists</h1>
          <p className="admin-lead">
            Choose a list to review and edit community submissions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="tier-btn tier-btn-ghost"
        >
          Sign out
        </button>
      </header>

      {error ? <p className="tier-error">{error}</p> : null}

      {!error ? (
        <div className="admin-list-picker">
          {TIER_LISTS.map((list) => (
            <Link
              key={list.id}
              to={`/admin/${list.slug}`}
              className="admin-list-picker-row"
            >
              <span className="admin-list-picker-title">{list.name}</span>
              <span className="admin-list-picker-meta">
                {list.items.length} items
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
