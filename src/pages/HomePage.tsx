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
      </section>

      <section className="home-categories">
        <h2 className="home-section-label">Tier lists</h2>
        <div className="home-index">
          {TIER_LISTS.map((list, index) => (
            <article key={list.id} className="home-index-row">
              <span className="home-index-num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="home-index-copy">
                <Link to={`/${list.slug}`} className="home-index-title">
                  {list.name}
                </Link>
                <p className="home-index-blurb">
                  {list.description} · {formatCount(list.items.length)} items
                </p>
              </div>
              <div className="home-index-actions">
                <Link to={`/${list.slug}`} className="home-index-action">
                  Rankings
                </Link>
                <Link
                  to={`/${list.slug}/rank`}
                  className="home-index-action home-index-action--primary"
                >
                  Rank yours
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
