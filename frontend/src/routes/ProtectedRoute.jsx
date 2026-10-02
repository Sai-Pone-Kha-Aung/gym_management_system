import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/ui/Spinner";

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // During development, if no auth token is required or auth is bypassed, we can allow access
  // or redirect to /login if unauthenticated.
  if (!isAuthenticated && localStorage.getItem("token") === null) {
    // For smooth development prototyping, if user navigated to dashboard without logging in, we can redirect to /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role?.toUpperCase() !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
