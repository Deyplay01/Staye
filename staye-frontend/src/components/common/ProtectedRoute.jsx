import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Guards routes by role; host pages allow both hosts and super admins.
 */
export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles }) {
  const { isAuthenticated, isHost, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner label="Checking your session..." />;

  const requiredRoles = allowedRoles || (requireAdmin ? ["host", "admin"] : null);
  if (requiredRoles) {
    if (!isAuthenticated || !requiredRoles.includes(role)) {
      if (isAuthenticated && isHost) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return children;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
