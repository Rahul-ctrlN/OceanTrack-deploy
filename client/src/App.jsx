import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Layout from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Vessels from "./pages/Vessels.jsx";
import Voyages from "./pages/Voyages.jsx";
import Cargo from "./pages/Cargo.jsx";
import Fuel from "./pages/Fuel.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Tracking from "./pages/Tracking.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import Profile from "./pages/Profile.jsx";

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ADMIN ROUTE
========================================================= */

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   APP
========================================================= */

function App() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* ===================================================
          PUBLIC ROUTES
      =================================================== */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate
              to="/dashboard"
              replace
            />
          ) : (
            <Register />
          )
        }
      />

      {/* ===================================================
          DASHBOARD
      =================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          VESSELS
      =================================================== */}

      <Route
        path="/vessels"
        element={
          <ProtectedRoute>
            <Layout>
              <Vessels />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          VOYAGES
      =================================================== */}

      <Route
        path="/voyages"
        element={
          <ProtectedRoute>
            <Layout>
              <Voyages />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          CARGO
      =================================================== */}

      <Route
        path="/cargo"
        element={
          <ProtectedRoute>
            <Layout>
              <Cargo />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          FUEL
      =================================================== */}

      <Route
        path="/fuel"
        element={
          <ProtectedRoute>
            <Layout>
              <Fuel />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          MAINTENANCE
      =================================================== */}

      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <Layout>
              <Maintenance />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          TRACKING
      =================================================== */}

      <Route
        path="/tracking"
        element={
          <ProtectedRoute>
            <Layout>
              <Tracking />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          REPORTS
      =================================================== */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          PROFILE
      =================================================== */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ===================================================
          ADMIN USERS
      =================================================== */}

      <Route
        path="/users"
        element={
          <AdminRoute>
            <Layout>
              <Users />
            </Layout>
          </AdminRoute>
        }
      />

      {/* ===================================================
          DEFAULT
      =================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;