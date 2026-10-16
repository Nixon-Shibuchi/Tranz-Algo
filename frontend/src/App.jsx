import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import AppShell from "./components/AppShell";
import LoadingState from "./components/LoadingState";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import InventoryPage from "./pages/InventoryPage";
import TrueCostPage from "./pages/TrueCostPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="pad">
        <LoadingState
          className="loading-state--page"
          label="Checking your session"
          tips={["Restoring your workspace…", "Almost ready…"]}
        />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
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
        path="/true-cost"
        element={
          <PrivateRoute>
            <TrueCostPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/true-cost/:id"
        element={
          <PrivateRoute>
            <TrueCostPage />
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
    </Routes>
  );
}
