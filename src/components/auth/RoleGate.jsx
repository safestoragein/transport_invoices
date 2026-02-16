import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RoleGate - Conditionally renders children based on user role
 */
const RoleGate = ({
  children,
  allowedRoles = [],
  fallback = null,
  requirePermission,
}) => {
  const { hasRole, hasPermission, isAuthenticated } = useAuth();

  // Not authenticated
  if (!isAuthenticated) {
    return fallback;
  }

  // Check permission if specified
  if (requirePermission) {
    if (!hasPermission(requirePermission)) {
      return fallback;
    }
  }

  // Check roles if specified
  if (allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(role => hasRole(role));
    if (!hasAllowedRole) {
      return fallback;
    }
  }

  return children;
};

/**
 * CanCreate - Only renders if user can create entries
 */
export const CanCreate = ({ children, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission('canCreate') ? children : fallback;
};

/**
 * CanEdit - Only renders if user can edit entries
 */
export const CanEdit = ({ children, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission('canEdit') ? children : fallback;
};

/**
 * CanDelete - Only renders if user can delete entries
 */
export const CanDelete = ({ children, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission('canDelete') ? children : fallback;
};

/**
 * CanApprove - Only renders if user can approve entries
 */
export const CanApprove = ({ children, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission('canApprove') ? children : fallback;
};

/**
 * CanMarkPaid - Only renders if user can mark entries as paid
 */
export const CanMarkPaid = ({ children, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission('canMarkPaid') ? children : fallback;
};

/**
 * IsAdmin - Only renders for admin users
 */
export const IsAdmin = ({ children, fallback = null }) => {
  const { hasRole } = useAuth();
  return hasRole('admin') ? children : fallback;
};

export default RoleGate;
