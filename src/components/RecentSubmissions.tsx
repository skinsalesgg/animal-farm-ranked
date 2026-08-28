import { Link } from "react-router-dom";

import type { SubmissionSummary } from "../api/rankings";

type RecentSubmissionsProps = {
  listSlug: string;
  submissions: SubmissionSummary[];
};

function formatSubmissionLabel(submission: SubmissionSummary) {
  const name = submission.displayName?.trim() || "Anonymous";
  const date = new Date(submission.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${name} · ${date}`;
}

export function RecentSubmissions({
  listSlug,
  submissions,
}: RecentSubmissionsProps) {
  if (submissions.length === 0) return null;

  return (
    <section className="tier-recent-submissions">
      <h2 className="tier-recent-submissions-title">Recent submissions</h2>
      <ul className="tier-recent-submissions-list">
        {submissions.map((submission) => (
          <li key={submission.id}>
            <Link
              to={`/${listSlug}/r/${submission.id}`}
              className="tier-recent-submissions-link"
            >
              {formatSubmissionLabel(submission)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
