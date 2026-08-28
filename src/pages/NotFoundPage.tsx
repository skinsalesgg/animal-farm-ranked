import { Link } from "react-router-dom";

import { PageMeta } from "../components/PageMeta";

export default function NotFoundPage() {
  return (
    <div className="tier-page">
      <PageMeta title="Not found" />
      <header className="tier-page-header">
        <h1 className="tier-page-title">Not found</h1>
        <p className="tier-page-lead">
          That tier list doesn&apos;t exist.
        </p>
        <p className="tier-page-lead">
          <Link to="/" className="tier-link">
            Back to all lists
          </Link>
        </p>
      </header>
    </div>
  );
}
