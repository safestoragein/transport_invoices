/**
 * Test Suite: constants.js
 * Verifies role structure, permissions, status values, and payment modes
 */
import {
  ROLES,
  PERMISSIONS,
  STATUS_VALUES,
  PAYMENT_MODES,
  STATUS_COLORS,
  MODULE_CONFIG,
  MODULE_NAMES,
} from '../utils/constants';

describe('Role Structure', () => {
  test('should have VIEWER, ACCOUNTS, ADMIN, CASHFREE_APPROVER, and IDFC_APPROVER roles', () => {
    expect(Object.keys(ROLES)).toEqual(['VIEWER', 'ACCOUNTS', 'ADMIN', 'CASHFREE_APPROVER', 'IDFC_APPROVER']);
    expect(ROLES.VIEWER).toBe('viewer');
    expect(ROLES.ACCOUNTS).toBe('accounts');
    expect(ROLES.ADMIN).toBe('admin');
    expect(ROLES.CASHFREE_APPROVER).toBe('cashfree_approver');
    expect(ROLES.IDFC_APPROVER).toBe('idfc_approver');
  });

  test('should NOT have MANAGER or UPLOADER roles', () => {
    expect(ROLES.MANAGER).toBeUndefined();
    expect(ROLES.UPLOADER).toBeUndefined();
  });
});

describe('Permissions', () => {
  test('VIEWER: read-only, no create/edit/delete/approve/markPaid', () => {
    const p = PERMISSIONS[ROLES.VIEWER];
    expect(p.canCreate).toBe(false);
    expect(p.canEdit).toBe(false);
    expect(p.canDelete).toBe(false);
    expect(p.canApprove).toBe(false);
    expect(p.canMarkPaid).toBe(false);
    expect(p.canViewAudit).toBe(false);
    expect(p.canViewAdmin).toBe(false);
    expect(p.modules).toContain('all');
  });

  test('ACCOUNTS: can create, edit, markPaid; cannot approve, delete, viewAdmin', () => {
    const p = PERMISSIONS[ROLES.ACCOUNTS];
    expect(p.canCreate).toBe(true);
    expect(p.canEdit).toBe(true);
    expect(p.canDelete).toBe(false);
    expect(p.canApprove).toBe(false);
    expect(p.canMarkPaid).toBe(true);
    expect(p.canViewAudit).toBe(true);
    expect(p.canViewAdmin).toBe(false);
    expect(p.modules).toContain('all');
  });

  test('ADMIN: full access to everything', () => {
    const p = PERMISSIONS[ROLES.ADMIN];
    expect(p.canCreate).toBe(true);
    expect(p.canEdit).toBe(true);
    expect(p.canDelete).toBe(true);
    expect(p.canApprove).toBe(true);
    expect(p.canMarkPaid).toBe(true);
    expect(p.canViewAudit).toBe(true);
    expect(p.canViewAdmin).toBe(true);
    expect(p.modules).toContain('all');
  });

  test('every defined role has a corresponding permissions entry', () => {
    Object.values(ROLES).forEach((role) => {
      expect(PERMISSIONS[role]).toBeDefined();
    });
  });
});

describe('Status Values', () => {
  test('should have the simplified statuses plus new workflow statuses', () => {
    expect(STATUS_VALUES.PENDING_APPROVAL).toBe('pending_approval');
    expect(STATUS_VALUES.READY_FOR_UPLOAD).toBe('ready_for_upload');
    expect(STATUS_VALUES.UPLOADED_TO_BANK).toBe('uploaded_to_bank');
    expect(STATUS_VALUES.REJECTED).toBe('rejected');
    expect(STATUS_VALUES.PAYMENT_DONE).toBe('payment_done');
    expect(STATUS_VALUES.ON_HOLD).toBe('on_hold');
    // Backward compat aliases
    expect(STATUS_VALUES.APPROVED).toBe('ready_for_upload');
    expect(STATUS_VALUES.UPLOADED_FOR_PAYMENT).toBe('uploaded_to_bank');
    expect(STATUS_VALUES.CLOSED).toBe('payment_done');
  });

  test('should NOT have old statuses', () => {
    expect(STATUS_VALUES.PENDING).toBeUndefined();
    expect(STATUS_VALUES.AWAITING_MANAGER_APPROVAL).toBeUndefined();
    expect(STATUS_VALUES.AWAITING_ACCOUNTS_APPROVAL).toBeUndefined();
    expect(STATUS_VALUES.AWAITING_PAYMENT).toBeUndefined();
  });

  test('every status has a color mapping', () => {
    Object.values(STATUS_VALUES).forEach((status) => {
      expect(STATUS_COLORS[status]).toBeDefined();
    });
  });
});

describe('Payment Modes', () => {
  test('should have IDFC Bank and Cashfree', () => {
    expect(PAYMENT_MODES.IDFC_BANK).toBe('IDFC Bank');
    expect(PAYMENT_MODES.CASHFREE).toBe('Cashfree');
  });

  test('should only have 2 payment modes', () => {
    expect(Object.keys(PAYMENT_MODES)).toHaveLength(2);
  });
});

describe('Module Configuration', () => {
  test('all 8 modules should be defined', () => {
    expect(Object.keys(MODULE_NAMES)).toHaveLength(8);
    expect(Object.keys(MODULE_CONFIG)).toHaveLength(8);
  });

  test('each module should have key, label, icon, path, amountField', () => {
    Object.values(MODULE_CONFIG).forEach((config) => {
      expect(config.key).toBeDefined();
      expect(config.label).toBeDefined();
      expect(config.icon).toBeDefined();
      expect(config.path).toBeDefined();
      expect(config.amountField).toBeDefined();
    });
  });

  test('module paths should all start with /', () => {
    Object.values(MODULE_CONFIG).forEach((config) => {
      expect(config.path).toMatch(/^\//);
    });
  });
});
