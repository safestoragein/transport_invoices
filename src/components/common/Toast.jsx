import React, { useEffect, useState } from 'react';

const variantStyles = {
  success: {
    bg: 'bg-success-50 border-success-200',
    icon: 'text-success-500',
    text: 'text-success-800',
  },
  danger: {
    bg: 'bg-danger-50 border-danger-200',
    icon: 'text-danger-500',
    text: 'text-danger-800',
  },
  warning: {
    bg: 'bg-warning-50 border-warning-200',
    icon: 'text-warning-500',
    text: 'text-warning-800',
  },
  info: {
    bg: 'bg-primary-50 border-primary-200',
    icon: 'text-primary-500',
    text: 'text-primary-800',
  },
};

const icons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  danger: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Toast component - Single notification
 */
const Toast = ({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const styles = variantStyles[variant] || variantStyles.info;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        flex items-center gap-3 p-4
        border rounded-lg shadow-lg
        ${styles.bg}
        ${isLeaving ? 'animate-slide-out' : 'animate-slide-up'}
        transition-all duration-300
      `}
      role="alert"
    >
      <span className={styles.icon}>{icons[variant]}</span>

      <p className={`flex-1 text-sm font-medium ${styles.text}`}>
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={`text-sm font-semibold ${styles.text} hover:underline`}
        >
          {action.label}
        </button>
      )}

      <button
        onClick={handleClose}
        className={`p-1 rounded hover:bg-black/5 ${styles.icon}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

/**
 * ToastContainer - Container for multiple toasts
 */
export const ToastContainer = ({ toasts = [], onClose, position = 'top-right' }) => {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`fixed z-50 ${positionStyles[position]} flex flex-col gap-2 max-w-sm w-full`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          action={toast.action}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

/**
 * Alert component - Inline alert (non-dismissible by default)
 */
export const Alert = ({
  children,
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const styles = variantStyles[variant] || variantStyles.info;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        flex items-start gap-3 p-4
        border rounded-lg
        ${styles.bg}
        ${className}
      `}
      role="alert"
    >
      <span className={`flex-shrink-0 ${styles.icon}`}>
        {icons[variant]}
      </span>

      <div className="flex-1">
        {title && (
          <h4 className={`font-semibold mb-1 ${styles.text}`}>{title}</h4>
        )}
        <div className={`text-sm ${styles.text}`}>{children}</div>
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className={`p-1 rounded hover:bg-black/5 ${styles.icon}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Toast;
