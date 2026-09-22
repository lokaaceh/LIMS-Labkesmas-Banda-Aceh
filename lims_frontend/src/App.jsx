import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LandingPage from "./features/landing/pages/LandingPage";
import DataManagement from "./features/data-management/pages/DataManagement";
import MasterPemeriksaan from "./features/master-pemeriksaan/pages/MasterPemeriksaanPage";
import PublicTrackingPage from "./features/tracking/pages/PublicTrackingPage";

import Login from "./features/auth/pages/login";
import Dashboard from "./pages/Dashboard";

// Import komponen & halaman dari folder fitur registrasi
import RegistrationPage from "./features/registration/pages/RegistrationMainPage";
import RegistrationEdit from "./features/registration/components/RegistrationEdit";

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

          {/* Route Public Tracking */}
          <Route path="/cek-status" element={<PublicTrackingPage />} />

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

          <Route
            path="/data-management"
            element={
              <ProtectedRoute>
                <DataManagement />
              </ProtectedRoute>
            }
          />

          {/* Route Master Pemeriksaan Laboratorium */}
          <Route
            path="/master/pemeriksaan"
            element={
              <ProtectedRoute allowedRoles={["admin", "lab", "manajemen"]}>
                <MasterPemeriksaan />
              </ProtectedRoute>
            }
          />

          {/* Route Utama Registrasi (List & Add) */}
          <Route
            path="/registrations"
            element={
              <ProtectedRoute>
                <RegistrationPage />
              </ProtectedRoute>
            }
          />

          {/* Route Edit Registration */}
          <Route
            path="/registrations/edit/:id"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "input", "lab", "manajemen"]}
              >
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
