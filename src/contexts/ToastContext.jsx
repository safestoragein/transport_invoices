import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

/**
 * Toast Provider - Manages notification state
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification
   * @param {object} options - Toast options
   * @returns {string} Toast ID
   */
  const addToast = useCallback((options) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = {
      id,
      message: options.message || options,
      variant: options.variant || 'info',
      duration: options.duration ?? 5000,
      action: options.action,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  /**
   * Remove a toast by ID
   * @param {string} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different variants
  const success = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'danger', ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'warning', ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ message, variant: 'info', ...options });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast context
 * @returns {object} Toast context value
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
