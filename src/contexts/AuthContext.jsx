import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES, PERMISSIONS, STORAGE_KEYS, AUDIT_ACTIONS } from '../utils/constants';
import storageService from '../services/storageService';

// Simple hash function for passwords (for demo - in production use bcrypt on backend)
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Pre-hashed credentials (passwords hashed with above function)
const USERS = {
  // Accounts team
  shreenth: {
    passwordHash: hashPassword('Shreenth@2026'),
    role: ROLES.ACCOUNTS,
    displayName: 'Shreenth'
  },
  jagannath: {
    passwordHash: hashPassword('Jagannath@2026'),
    role: ROLES.ACCOUNTS,
    displayName: 'Jagannath'
  },
  lakshman: {
    passwordHash: hashPassword('Lakshman@2026'),
    role: ROLES.ACCOUNTS,
    displayName: 'Lakshman'
  },
  srikanth: {
    passwordHash: hashPassword('Srikanth@2026'),
    role: ROLES.ACCOUNTS,
    displayName: 'Srikanth'
  },
  // Admin
  ramesh: {
    passwordHash: hashPassword('Ramesh@2026'),
    role: ROLES.ADMIN,
    displayName: 'Ramesh'
  },
  // Viewers
  anush: {
    passwordHash: hashPassword('Anush@2026'),
    role: ROLES.VIEWER,
    displayName: 'Anush'
  },
  harsha: {
    passwordHash: hashPassword('Harsha@2026'),
    role: ROLES.VIEWER,
    displayName: 'Harsha'
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = storageService.getUser();
    if (storedUser && storedUser.sessionExpiry) {
      // Check if session is still valid
      if (new Date(storedUser.sessionExpiry) > new Date()) {
        setUser(storedUser);
      } else {
        // Session expired
        storageService.clearUser();
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {object} Result { success, error }
   */
  const login = useCallback((username, password) => {
    setError(null);

    const userConfig = USERS[username.toLowerCase()];
    if (!userConfig) {
      setError('Invalid username or password');
      return { success: false, error: 'Invalid username or password' };
    }

    const hashedInput = hashPassword(password);
    if (hashedInput !== userConfig.passwordHash) {
      setError('Invalid username or password');
      return { success: false, error: 'Invalid username or password' };
    }

    // Create session (24 hour expiry)
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 24);

    const userData = {
      username: username.toLowerCase(),
      role: userConfig.role,
      displayName: userConfig.displayName,
      permissions: PERMISSIONS[userConfig.role],
      loginTime: new Date().toISOString(),
      sessionExpiry: sessionExpiry.toISOString(),
    };

    setUser(userData);
    storageService.setUser(userData);

    // Log login action
    storageService.addAuditLog({
      action: AUDIT_ACTIONS.LOGIN,
      userId: userData.username,
      username: userData.displayName,
      module: 'auth',
      details: `User ${userData.username} logged in`,
    });

    return { success: true };
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    if (user) {
      // Log logout action
      storageService.addAuditLog({
        action: AUDIT_ACTIONS.LOGOUT,
        userId: user.username,
        username: user.displayName,
        module: 'auth',
        details: `User ${user.username} logged out`,
      });
    }

    setUser(null);
    storageService.clearUser();
  }, [user]);

  /**
   * Check if user has permission
   * @param {string} permission - Permission name
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions[permission] === true;
  }, [user]);

  /**
   * Check if user has access to a module
   * @param {string} moduleName - Module name
   * @returns {boolean}
   */
  const hasModuleAccess = useCallback((moduleName) => {
    if (!user || !user.permissions) return false;
    const modules = user.permissions.modules || [];
    return modules.includes('all') || modules.includes(moduleName);
  }, [user]);

  /**
   * Check if user has a specific role
   * @param {string|string[]} roles - Role(s) to check
   * @returns {boolean}
   */
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(() => {
    if (!user) return;

    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 24);

    const updatedUser = {
      ...user,
      sessionExpiry: sessionExpiry.toISOString(),
    };

    setUser(updatedUser);
    storageService.setUser(updatedUser);
  }, [user]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    hasModuleAccess,
    hasRole,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 * @returns {object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
