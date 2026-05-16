// frontend/src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function App() {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    // Run once on startup — restores session and sets up auth listener
    initializeAuth();
  }, []);

  // Block the entire app render until we know the auth state
  // Prevents routing to wrong page on first load
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading workspace..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;