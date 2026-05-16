// frontend/src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  // Wait for auth check to complete before deciding
  // This prevents the "flash to login" problem on page reload
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <LoadingSpinner size="lg" message="Restoring session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save where they were trying to go — redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;