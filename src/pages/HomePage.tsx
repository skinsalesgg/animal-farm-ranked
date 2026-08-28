import { Link } from "react-router-dom";

import { PageMeta } from "../components/PageMeta";
import { SITE_NAME, SITE_TAGLINE } from "../config";
import { TIER_LISTS } from "../lists";
import "./HomePage.css";

const countFormatter = new Intl.NumberFormat("en-US");

function formatCount(value: number): string {
  return countFormatter.format(value);
}

export default function HomePage() {
  const primaryList = TIER_LISTS[0];

  return (
    <div className="home-page">
      <PageMeta title={SITE_NAME} description={SITE_TAGLINE} />

      <section className="home-hero">
        <span className="home-hero-eyebrow">
          Community tier lists — stickers, skins, collections
        </span>
        <h1 className="home-hero-title">
          Rank the items.
          <br />
          See what the community thinks.
        </h1>
        <p className="home-hero-subtitle">{SITE_TAGLINE}</p>
        {primaryList ? (
          <div className="home-hero-actions">
            <Link to={`/${primaryList.slug}`} className="home-cta-primary">
              View community rankings
            </Link>
            <Link to={`/${primaryList.slug}/rank`} className="home-cta-secondary">
              Submit your tier list
            </Link>
          </div>
        ) : null}
      </section>

      <section className="home-categories">
        <h2 className="home-section-label">Index</h2>
        <div className="home-index">
          {TIER_LISTS.map((list, index) => (
            <Link
              key={list.id}
              to={`/${list.slug}`}
              className="home-index-row"
            >
              <span className="home-index-num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="home-index-title">{list.name}</span>
              <span className="home-index-blurb">
                {list.description} · {formatCount(list.items.length)} items
              </span>
              <span className="home-index-path" aria-hidden="true">
                /{list.slug}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
