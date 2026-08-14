import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { Logo } from "./components/Brand";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import InventoryPage from "./pages/InventoryPage";
import TaxProfilesPage from "./pages/TaxProfilesPage";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/shipments", label: "Shipments" },
  { to: "/inventory", label: "Stock" },
  { to: "/tax-profiles", label: "Tax profiles" },
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className={`app-shell ${drawerOpen ? "drawer-open" : ""}`}>
      <header className="topbar">
        <button
          type="button"
          className="btn ghost menu-btn"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          Menu
        </button>
        <Link to="/" className="brand">
          <Logo size={32} />
          <span>
            Tranz-Algo
            <small>Admin</small>
          </span>
        </Link>
        <button
          type="button"
          className="btn ghost logout-btn"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </header>

      {drawerOpen && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className={`nav-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <div className="brand">
            <Logo size={36} />
            <span>
              Tranz-Algo
              <small>{user?.email}</small>
            </span>
          </div>
          <button
            type="button"
            className="btn ghost"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            Close
          </button>
        </div>
        <nav className="drawer-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "drawer-link active" : "drawer-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="pad">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/shipments"
        element={
          <PrivateRoute>
            <ShipmentsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <PrivateRoute>
            <ShipmentDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <PrivateRoute>
            <InventoryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/tax-profiles"
        element={
          <PrivateRoute>
            <TaxProfilesPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
