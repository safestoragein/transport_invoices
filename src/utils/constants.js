// Application version for localStorage migration
export const APP_VERSION = '2.0.0';
export const STORAGE_VERSION_KEY = 'ACCOUNTS_APP_VERSION';

// Status values for approval workflow
export const STATUS_VALUES = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
};

// User roles
export const ROLES = {
  VIEWER: 'viewer',
  ACCOUNTS: 'accounts',
  ADMIN: 'admin',
};

// Payment modes
export const PAYMENT_MODES = {
  BANK: 'Bank',
  CASHFREE: 'Cashfree',
};

// Role permissions
export const PERMISSIONS = {
  [ROLES.VIEWER]: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canMarkPaid: false,
    canViewAudit: false,
    canViewAdmin: false,
    modules: ['all'],
  },
  [ROLES.ACCOUNTS]: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canApprove: false,
    canMarkPaid: true,
    canViewAudit: true,
    canViewAdmin: false,
    modules: ['all'],
  },
  [ROLES.ADMIN]: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canMarkPaid: true,
    canViewAudit: true,
    canViewAdmin: true,
    modules: ['all'],
  },
};

// Module names and configurations
export const MODULE_NAMES = {
  TRANSPORT: 'transport',
  GENERAL: 'general',
  PACKING: 'packing',
  PETTY_CASH: 'petty',
  HAPPY_CARD: 'happy',
  REFUNDS: 'refunds',
  DRIVE_TRACK: 'drive',
  REVIEWS: 'reviews',
};

export const MODULE_CONFIG = {
  [MODULE_NAMES.TRANSPORT]: {
    key: 'transport',
    label: 'Transport Bills',
    icon: '🚚',
    path: '/transport-bills',
    amountField: 'invoiceAmount',
    hasProfit: true,
  },
  [MODULE_NAMES.GENERAL]: {
    key: 'general',
    label: 'General Bills',
    icon: '📄',
    path: '/general-bills',
    amountField: 'payableAmount',
    hasProfit: false,
  },
  [MODULE_NAMES.PACKING]: {
    key: 'packing',
    label: 'Packing Materials',
    icon: '📦',
    path: '/packing-materials',
    amountField: 'payableAmount',
    hasProfit: false,
  },
  [MODULE_NAMES.PETTY_CASH]: {
    key: 'petty',
    label: 'Petty Cash',
    icon: '💰',
    path: '/petty-cash',
    amountField: 'amount',
    hasProfit: false,
  },
  [MODULE_NAMES.HAPPY_CARD]: {
    key: 'happy',
    label: 'Happy Card',
    icon: '💳',
    path: '/happy-card',
    amountField: 'payableAmount',
    hasProfit: false,
  },
  [MODULE_NAMES.REFUNDS]: {
    key: 'refunds',
    label: 'Refunds',
    icon: '↩️',
    path: '/refunds',
    amountField: 'refundAmount',
    hasProfit: false,
    isExpense: true,
  },
  [MODULE_NAMES.DRIVE_TRACK]: {
    key: 'drive',
    label: 'Drive Track/Porter',
    icon: '🚗',
    path: '/drive-track',
    amountField: 'amount',
    hasProfit: false,
  },
  [MODULE_NAMES.REVIEWS]: {
    key: 'reviews',
    label: 'Reviews',
    icon: '⭐',
    path: '/reviews',
    amountField: 'amount',
    hasProfit: false,
  },
};

// Storage keys for localStorage
export const STORAGE_KEYS = {
  USER: 'accounts_user',
  TRANSPORT: 'accounts_transport',
  GENERAL: 'accounts_general',
  PACKING: 'accounts_packing',
  PETTY_CASH: 'accounts_petty',
  HAPPY_CARD: 'accounts_happy',
  REFUNDS: 'accounts_refunds',
  DRIVE_TRACK: 'accounts_drive',
  REVIEWS: 'accounts_reviews',
  AUDIT: 'accounts_audit',
  FILTERS: 'accounts_filters',
};

// Audit action types
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  MARK_PAID: 'MARK_PAID',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

// Payment status options
export const PAYMENT_STATUS = {
  PAYMENT_DONE: 'Payment done',
  HOLD: 'Hold',
  PARTIALLY_PENDING: 'partially pending',
  PENDING: 'Pending',
};

// Badge color mappings
export const STATUS_COLORS = {
  [STATUS_VALUES.PENDING_APPROVAL]: 'warning',
  [STATUS_VALUES.APPROVED]: 'primary',
  [STATUS_VALUES.REJECTED]: 'danger',
  [STATUS_VALUES.CLOSED]: 'success',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Date format options
export const DATE_FORMAT = {
  DISPLAY: 'en-IN',
  INPUT: 'yyyy-MM-dd',
};
