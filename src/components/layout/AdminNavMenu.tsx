import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { TIER_LISTS } from "../../lists";

export function AdminNavMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const currentSlug = location.pathname.match(/^\/admin\/([^/]+)/)?.[1];

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!isAdminRoute) {
    return null;
  }

  return (
    <div className="nav-admin" ref={menuRef}>
      <button
        type="button"
        className={`nav-link nav-admin-button${isAdminRoute ? " nav-link--current" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        Admin
        <span className="nav-admin-caret" aria-hidden="true" />
      </button>
      {open ? (
        <div className="nav-admin-menu" role="menu">
          <Link
            to="/admin"
            className={`nav-admin-item${location.pathname === "/admin" ? " nav-admin-item--current" : ""}`}
            role="menuitem"
          >
            All lists
          </Link>
          {TIER_LISTS.map((list) => (
            <Link
              key={list.id}
              to={`/admin/${list.slug}`}
              className={`nav-admin-item${currentSlug === list.slug ? " nav-admin-item--current" : ""}`}
              role="menuitem"
            >
              {list.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
