import { Link, NavLink, useLocation } from "react-router-dom";

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
      <path d="M12 12v8M4 8.5l8 3.5 8-3.5" />
    </svg>
  ),
  shipments: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 7h11v10H3z" />
      <path d="M14 10h4.5L21 13v4h-7" />
      <circle cx="7" cy="18.5" r="1.5" />
      <circle cx="17" cy="18.5" r="1.5" />
    </svg>
  ),
  stock: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 19V9l8-4 8 4v10" />
      <path d="M4 9l8 4 8-4M12 13v10" />
    </svg>
  ),
  tax: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M7 4h7l3 3v13H7V4Z" />
      <path d="M14 4v3h3M9 12h6M9 16h4" />
    </svg>
  ),
  truecost: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 20V14M8.5 20V9M14 20v-7.5M19.5 20V4" strokeLinecap="round" />
    </svg>
  ),
};

export const NAV_SECTIONS = [
  {
    id: "core",
    label: "Costing engine",
    items: [
      {
        to: "/true-cost",
        label: "True Cost",
        icon: "truecost",
        match: "prefix",
        feature: true,
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { to: "/", label: "Dashboard", end: true, icon: "dashboard" },
      { to: "/products", label: "Products", icon: "products" },
      { to: "/shipments", label: "Shipments", icon: "shipments", match: "prefix" },
      { to: "/inventory", label: "Stock", icon: "stock" },
    ],
  },
  {
    id: "setup",
    label: "Setup",
    items: [{ to: "/tax-profiles", label: "Tax profiles", icon: "tax" }],
  },
];

function linkIsActive(item, pathname) {
  if (item.match === "prefix") {
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  }
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function SideNav({ onNavigate }) {
  const location = useLocation();

  return (
    <nav className="side-nav" aria-label="Primary">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id} className="nav-section">
          <p className="nav-section-label">{section.label}</p>
          <ul className="nav-list">
            {section.items.map((item) => {
              const active = linkIsActive(item, location.pathname);
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={() =>
                      `nav-link${active ? " active" : ""}${item.feature ? " feature" : ""}`
                    }
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    <span className="nav-link-icon">{ICONS[item.icon]}</span>
                    <span className="nav-link-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const CRUMBS = [
  { test: (p) => p === "/", label: "Dashboard" },
  { test: (p) => p.startsWith("/true-cost"), label: "True Cost" },
  { test: (p) => p === "/products", label: "Products" },
  { test: (p) => p === "/shipments", label: "Shipments" },
  {
    test: (p) => p.startsWith("/shipments/"),
    crumbs: [
      { to: "/shipments", label: "Shipments" },
      { label: "Batch detail" },
    ],
  },
  { test: (p) => p === "/inventory", label: "Stock" },
  { test: (p) => p === "/tax-profiles", label: "Tax profiles" },
];

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const match = CRUMBS.find((c) => c.test(pathname));
  if (!match) return null;

  const items = match.crumbs || [{ label: match.label }];

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              <span className="crumb-sep" aria-hidden="true">
                /
              </span>
              {last || !item.to ? (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
