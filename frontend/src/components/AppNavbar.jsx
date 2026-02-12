import React from "react";
import { Link, NavLink } from "react-router-dom";
import NavArrow from "./NavArrow.jsx";

export default function AppNavbar({
  title = "Health-Lock",
  showBack = false,
  aboutTo = "/",
  supportTo = "/",
  showProfile = false,
  profileTo = "/signin",
  onProfileClick,
  onLogout,
}) {
  const navLinkClass = "app-nav-link";

  return (
    <header className="app-navbar">
      <div className="container py-3">
        <div className="app-navbar-inner">
          <div className="d-flex align-items-center gap-2">
            {showBack && <NavArrow />}
            <Link className="app-navbar-brand" to="/">
              {title}
            </Link>
          </div>

          <nav className="app-top-nav" aria-label="Primary">
            <NavLink end className={navLinkClass} to="/">Home</NavLink>
            <NavLink className={navLinkClass} to={aboutTo}>About</NavLink>
            <NavLink className={navLinkClass} to={supportTo}>Support</NavLink>

            {showProfile && (
              <>
                {onProfileClick ? (
                  <button
                    className="app-nav-btn"
                    type="button"
                    onClick={onProfileClick}
                    aria-label="Open profile"
                    title="Profile"
                  >
                    Profile
                  </button>
                ) : (
                  <NavLink className={navLinkClass} to={profileTo}>Profile</NavLink>
                )}
              </>
            )}

            {onLogout && (
              <button className="app-nav-btn app-nav-danger" type="button" onClick={onLogout}>
                Logout
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
