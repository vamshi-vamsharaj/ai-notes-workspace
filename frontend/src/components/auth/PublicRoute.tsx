import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute = ({
  children,
}: PublicRouteProps) => {
  const {
    isAuthenticated,
    isInitialized,
  } = useAuthStore();

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};