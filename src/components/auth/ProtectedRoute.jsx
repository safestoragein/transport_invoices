import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';

/**
 * ProtectedRoute - Wraps routes that require authentication
 */
const ProtectedRoute = ({ children, requiredRoles, fallback }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Check required roles if specified
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      // User doesn't have required role
      if (fallback) {
        return fallback;
      }
      // Redirect to dashboard
      return <Navigate to="/dashboard" replace state={{ from: location }} />;
    }
  }

  return children;
};

export default ProtectedRoute;
