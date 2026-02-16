import React from 'react';

const variantStyles = {
  success: 'bg-success-100 text-success-700 border-success-200',
  danger: 'bg-danger-100 text-danger-700 border-danger-200',
  warning: 'bg-warning-100 text-warning-700 border-warning-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
  secondary: 'bg-gray-100 text-gray-700 border-gray-200',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Badge component for status indicators
 */
const Badge = ({
  children,
  variant = 'secondary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border';

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.secondary} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            variant === 'success' ? 'bg-success-500' :
            variant === 'danger' ? 'bg-danger-500' :
            variant === 'warning' ? 'bg-warning-500' :
            variant === 'primary' ? 'bg-primary-500' :
            'bg-gray-500'
          }`}
        />
      )}
      {children}
    </span>
  );
};

/**
 * Status Badge - Pre-configured for common status values
 */
export const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' },
    awaiting_manager_approval: { label: 'Awaiting Manager', variant: 'warning' },
    awaiting_accounts_approval: { label: 'Awaiting Accounts', variant: 'warning' },
    awaiting_payment: { label: 'Awaiting Payment', variant: 'primary' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    closed: { label: 'Closed', variant: 'success' },
    'Payment done': { label: 'Paid', variant: 'success' },
    Hold: { label: 'Hold', variant: 'warning' },
    'partially pending': { label: 'Partial', variant: 'warning' },
    Pending: { label: 'Pending', variant: 'warning' },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' };

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

/**
 * Approval Badge - Shows approval status
 */
export const ApprovalBadge = ({ status, size = 'sm' }) => {
  const config = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
  };

  const { label, variant } = config[status] || config.pending;

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};

/**
 * Role Badge - Shows user role
 */
export const RoleBadge = ({ role, size = 'sm' }) => {
  const config = {
    uploader: { label: 'Uploader', variant: 'secondary' },
    manager: { label: 'Manager', variant: 'primary' },
    accounts: { label: 'Accounts', variant: 'success' },
    admin: { label: 'Admin', variant: 'danger' },
  };

  const { label, variant } = config[role] || config.uploader;

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
};

export default Badge;
