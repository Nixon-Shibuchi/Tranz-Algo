import { useEffect, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Logo } from "./Brand";
import ThemeSwitcher from "./ThemeSwitcher";
import { Breadcrumbs, SideNav } from "./Navigation";
import DoodleBackdrop from "./Doodles";

const SIDEBAR_KEY = "tranz_sidebar";

function readSidebarOpen() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SIDEBAR_KEY) !== "closed";
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(readSidebarOpen);
  const drawerTitleId = useId();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, desktopNavOpen ? "open" : "closed");
  }, [desktopNavOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  function openNav() {
    if (window.matchMedia("(min-width: 960px)").matches) {
      setDesktopNavOpen(true);
    } else {
      setMobileNavOpen(true);
    }
  }

  function closeDesktopNav() {
    setDesktopNavOpen(false);
  }

  function signOut() {
    logout();
    navigate("/login");
  }

  const sidebar = (
    <>
      <div className="sidebar-brand">
        <Link to="/" className="brand" onClick={() => setMobileNavOpen(false)}>
          <Logo size={34} />
          <span>
            Tranz-Algo
            <small>True-cost admin</small>
          </span>
        </Link>
        <button
          type="button"
          className="btn ghost sidebar-collapse-btn"
          aria-label="Close navigation"
          onClick={() => {
            setMobileNavOpen(false);
            closeDesktopNav();
          }}
        >
          Close
        </button>
      </div>

      <SideNav onNavigate={() => setMobileNavOpen(false)} />

      <div className="sidebar-foot">
        <ThemeSwitcher />
        <div className="user-card">
          <div className="user-avatar" aria-hidden="true">
            {(user?.full_name || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="user-meta">
            <strong>{user?.full_name || "Admin"}</strong>
            <span title={user?.email}>{user?.email}</span>
          </div>
          <button type="button" className="btn ghost user-logout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className={`app-shell${mobileNavOpen ? " nav-open" : ""}${
        !desktopNavOpen ? " sidebar-collapsed" : ""
      }`}
    >
      <DoodleBackdrop className="app-doodles" />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside
        className={`sidebar desktop-sidebar${desktopNavOpen ? "" : " is-closed"}`}
        aria-label="Main navigation"
        aria-hidden={!desktopNavOpen}
      >
        {sidebar}
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button
            type="button"
            className="btn ghost menu-btn"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen || desktopNavOpen}
            aria-controls="mobile-nav"
            onClick={openNav}
          >
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Menu
          </button>

          <Link to="/" className="brand mobile-brand">
            <Logo size={30} />
            <span>
              Tranz-Algo
              <small>Admin</small>
            </span>
          </Link>

          <div className="topbar-center">
            <Breadcrumbs />
          </div>

          <div className="topbar-actions">
            <ThemeSwitcher compact />
          </div>
        </header>

        <main className="content" id="main-content">
          {children}
        </main>
      </div>

      {mobileNavOpen && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        id="mobile-nav"
        className={`sidebar mobile-sidebar${mobileNavOpen ? " open" : ""}`}
        aria-hidden={!mobileNavOpen}
        aria-labelledby={drawerTitleId}
      >
        <div className="mobile-sidebar-head">
          <p id={drawerTitleId} className="nav-drawer-title">
            Navigation
          </p>
          <button
            type="button"
            className="btn ghost"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            Close
          </button>
        </div>
        {sidebar}
      </aside>
    </div>
  );
}
