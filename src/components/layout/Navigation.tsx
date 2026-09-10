import { Link } from "react-router-dom";

import { AdminNavMenu } from "./AdminNavMenu";
import "./Navigation.css";

export default function Navigation() {
  return (
    <nav className="navigation" aria-label="Main">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">
            Animal Farm<span className="nav-logo-tld"> Ranked</span>
          </Link>
          <div className="nav-links-desktop">
            <AdminNavMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
