import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { adminApi } from "../api/admin";
import { PageMeta } from "../components/PageMeta";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminApi
      .getSession()
      .then((session) => {
        if (!session.configured) {
          setError("Admin login is not configured on the API.");
          return;
        }
        if (session.authenticated) {
          navigate("/admin/kato-2014-holos", { replace: true });
        }
      })
      .catch(() => {
        setError("Could not reach the API.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await adminApi.login(username, password);
      navigate("/admin/kato-2014-holos", { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Login failed.",
      );
    } finally {
      setSubmitting(false);
    }
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
      <PageMeta title="Admin login" />
      <div className="admin-card">
        <h1 className="admin-title">Admin login</h1>
        <p className="admin-lead">
          Sign in to edit community submissions.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="tier-name-field">
            <span className="tier-name-label">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="tier-name-input"
            />
          </label>

          <label className="tier-name-field">
            <span className="tier-name-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="tier-name-input"
            />
          </label>

          {error ? <p className="tier-error">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !username.trim() || !password}
            className="tier-btn tier-btn-primary admin-submit"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="admin-footer">
          <Link to="/" className="tier-link">
            Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}

export function AdminRedirect() {
  return <Navigate to="/admin/kato-2014-holos" replace />;
}
