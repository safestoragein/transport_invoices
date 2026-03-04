// Application version for localStorage migration
export const APP_VERSION = '3.0.0';
export const STORAGE_VERSION_KEY = 'ACCOUNTS_APP_VERSION';

// Status values for 4-stage approval workflow
// PENDING_APPROVAL → READY_FOR_UPLOAD → UPLOADED_TO_BANK → PAYMENT_DONE
export const STATUS_VALUES = {
  PENDING_APPROVAL: 'pending_approval',
  READY_FOR_UPLOAD: 'ready_for_upload',
  UPLOADED_TO_BANK: 'uploaded_to_bank',
  PAYMENT_DONE: 'payment_done',
  REJECTED: 'rejected',
  ON_HOLD: 'on_hold',
  // Backward compat aliases
  APPROVED: 'ready_for_upload',
  UPLOADED_FOR_PAYMENT: 'uploaded_to_bank',
  CLOSED: 'payment_done',
};

// Payment statuses (derived from bill_payments)
export const PAYMENT_STATUS_DERIVED = {
  PENDING: 'Pending Payment',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
};

// User roles
export const ROLES = {
  VIEWER: 'viewer',
  ACCOUNTS: 'accounts',
  ADMIN: 'admin',
  CASHFREE_APPROVER: 'cashfree_approver',
  IDFC_APPROVER: 'idfc_approver',
};

// Payment modes
export const PAYMENT_MODES = {
  IDFC_BANK: 'IDFC Bank',
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
  [ROLES.CASHFREE_APPROVER]: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: true,
    canMarkPaid: true,
    canViewAudit: true,
    canViewAdmin: false,
    modules: ['all'],
  },
  [ROLES.IDFC_APPROVER]: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: true,
    canMarkPaid: false,
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
    amountField: 'finalPayable',
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

// Sidebar navigation config
export const SIDEBAR_NAV = [
  { path: '/dashboard', label: 'Overview', icon: 'LayoutDashboard', roles: 'all' },
  { path: '/approvals', label: 'Approvals', icon: 'CheckCircle', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/transport-bills', label: 'Transport', icon: 'Truck', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/general-bills', label: 'General', icon: 'FileText', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/packing-materials', label: 'Packing', icon: 'Package', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/petty-cash', label: 'Petty Cash', icon: 'Wallet', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/vendor-ledger', label: 'Vendor Ledger', icon: 'BookOpen', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/reports', label: 'Reports', icon: 'BarChart3', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/audit', label: 'Audit Log', icon: 'Shield', roles: [ROLES.ACCOUNTS, ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER] },
  { path: '/admin', label: 'Admin', icon: 'Settings', roles: [ROLES.ADMIN, ROLES.IDFC_APPROVER] },
];

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
  UPLOAD_FOR_PAYMENT: 'UPLOAD_FOR_PAYMENT',
  ADD_PAYMENT: 'ADD_PAYMENT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

// Management approval status
export const MGMT_APPROVAL = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Payment status options (legacy)
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAYMENT_DONE: 'Payment done',
  HOLD: 'Hold',
  PARTIALLY_PENDING: 'partially pending',
  YET_TO_UPLOAD: 'Yet to upload',
  UPLOADED: 'Uploaded',
  EXPIRED: 'Expired',
  NOT_VALID: 'Not valid',
};

// Badge color mappings
export const STATUS_COLORS = {
  [STATUS_VALUES.PENDING_APPROVAL]: 'warning',
  [STATUS_VALUES.READY_FOR_UPLOAD]: 'primary',
  [STATUS_VALUES.UPLOADED_TO_BANK]: 'info',
  [STATUS_VALUES.PAYMENT_DONE]: 'success',
  [STATUS_VALUES.REJECTED]: 'danger',
  [STATUS_VALUES.ON_HOLD]: 'warning',
  // Legacy compat
  approved: 'primary',
  uploaded_for_payment: 'info',
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

// Valid status transitions (prevent skipping stages)
export const STATUS_TRANSITIONS = {
  [STATUS_VALUES.PENDING_APPROVAL]: [STATUS_VALUES.READY_FOR_UPLOAD, STATUS_VALUES.REJECTED, STATUS_VALUES.ON_HOLD],
  [STATUS_VALUES.READY_FOR_UPLOAD]: [STATUS_VALUES.UPLOADED_TO_BANK, STATUS_VALUES.ON_HOLD],
  [STATUS_VALUES.UPLOADED_TO_BANK]: [STATUS_VALUES.PAYMENT_DONE, STATUS_VALUES.ON_HOLD],
  [STATUS_VALUES.PAYMENT_DONE]: [], // Terminal state
  [STATUS_VALUES.REJECTED]: [STATUS_VALUES.PENDING_APPROVAL], // Can resubmit
  [STATUS_VALUES.ON_HOLD]: [STATUS_VALUES.PENDING_APPROVAL, STATUS_VALUES.READY_FOR_UPLOAD, STATUS_VALUES.UPLOADED_TO_BANK],
};

// Check if a status transition is valid
export const isValidTransition = (fromStatus, toStatus) => {
  // Normalize legacy statuses
  const normalizeStatus = (s) => {
    if (s === 'approved' || s === 'awaiting_payment') return STATUS_VALUES.READY_FOR_UPLOAD;
    if (s === 'uploaded_for_payment') return STATUS_VALUES.UPLOADED_TO_BANK;
    if (s === 'closed') return STATUS_VALUES.PAYMENT_DONE;
    if (s === 'pending' || s === 'awaiting_manager_approval' || s === 'awaiting_accounts_approval') return STATUS_VALUES.PENDING_APPROVAL;
    return s;
  };

  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  const allowed = STATUS_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
};
