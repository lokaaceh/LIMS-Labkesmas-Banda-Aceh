// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegistrationEdit from "./pages/RegistrationEdit";

// --- TAMBAHKAN IMPORT INI ---
import PublicTracking from "./pages/PublicTracking"; 
// ----------------------------

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route Halaman Utama (Landing Page) */}
          <Route path="/" element={<LandingPage />} />

          {/* --- TAMBAHKAN ROUTE CEK STATUS DI SINI --- */}
          {/* Taruh di luar PublicRoute atau ProtectedRoute karena bisa diakses siapa saja */}
          <Route path="/cek-status" element={<PublicTracking />} />
          {/* ------------------------------------------ */}

          {/* Route Login */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Route Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Route Edit Registration */}
          <Route
            path="/registrations/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "input", "lab", "manajemen"]}>
                <RegistrationEdit />
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;