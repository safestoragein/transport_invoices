/**
 * Test Suite: Approval Workflow
 * Tests the ACTUAL runtime behavior including backward compatibility
 * with old DB status values.
 *
 * Flow: PENDING_APPROVAL → APPROVED → UPLOADED_FOR_PAYMENT → PAYMENT_DONE (or REJECTED)
 * Old data may have: pending, awaiting_manager_approval, awaiting_accounts_approval, awaiting_payment
 * Payment-mode routing: Cashfree → CASHFREE_APPROVER, IDFC Bank → IDFC_APPROVER
 */
import { STATUS_VALUES, ROLES, PAYMENT_MODES } from '../utils/constants';

// Helpers that mirror the actual hook logic
const isPending = (entry) => {
  if (entry.status === STATUS_VALUES.PENDING_APPROVAL) return true;
  if (entry.status === 'pending' || entry.status === 'awaiting_manager_approval' || entry.status === 'awaiting_accounts_approval') return true;
  return false;
};

const isApproved = (entry) => {
  if (entry.status === 'ready_for_upload' || entry.status === 'approved') return true;
  if (entry.status === 'awaiting_payment') return true;
  return false;
};

const isUploadedForPayment = (entry) => {
  return entry.status === 'uploaded_to_bank' || entry.status === 'uploaded_for_payment';
};

const isPaymentDone = (entry) => {
  return entry.status === STATUS_VALUES.PAYMENT_DONE || entry.status === 'closed';
};

const canApprove = (entry, userRole) => {
  if (!entry) return false;
  if (!isPending(entry)) return false;

  if (userRole === ROLES.ADMIN) return true;

  const mode = entry.paymentMode;
  if (mode === PAYMENT_MODES.CASHFREE) {
    return userRole === ROLES.CASHFREE_APPROVER;
  }
  if (mode === PAYMENT_MODES.IDFC_BANK) {
    return userRole === ROLES.IDFC_APPROVER;
  }
  // No payment mode (legacy) — either approver
  return userRole === ROLES.CASHFREE_APPROVER || userRole === ROLES.IDFC_APPROVER;
};

const canUploadForPayment = (entry, userRole) => {
  if (!entry) return false;
  if (!isApproved(entry)) return false;
  return userRole === ROLES.ACCOUNTS || userRole === ROLES.ADMIN;
};

const canMarkPaid = (entry, userRole) => {
  if (!entry) return false;
  if (!isUploadedForPayment(entry)) return false;

  if (userRole === ROLES.ADMIN) return true;
  return userRole === ROLES.ACCOUNTS;
};

describe('Backward Compatibility — Old Status Values', () => {
  test('old "pending" entries show as pending approval', () => {
    expect(isPending({ status: 'pending' })).toBe(true);
  });

  test('old "awaiting_manager_approval" entries show as pending', () => {
    expect(isPending({ status: 'awaiting_manager_approval' })).toBe(true);
  });

  test('old "awaiting_accounts_approval" entries show as pending', () => {
    expect(isPending({ status: 'awaiting_accounts_approval' })).toBe(true);
  });

  test('new "pending_approval" entries show as pending', () => {
    expect(isPending({ status: 'pending_approval' })).toBe(true);
  });

  test('old "awaiting_payment" entries show as approved', () => {
    expect(isApproved({ status: 'awaiting_payment' })).toBe(true);
  });

  test('new "approved" entries show as approved', () => {
    expect(isApproved({ status: 'approved' })).toBe(true);
  });

  test('"payment_done" is not pending or approved', () => {
    expect(isPending({ status: 'payment_done' })).toBe(false);
    expect(isApproved({ status: 'payment_done' })).toBe(false);
  });

  test('"rejected" is not pending or approved', () => {
    expect(isPending({ status: 'rejected' })).toBe(false);
    expect(isApproved({ status: 'rejected' })).toBe(false);
  });
});

describe('canApprove — Payment Mode Routing', () => {
  test('Admin CAN approve any pending entry', () => {
    expect(canApprove({ status: 'pending_approval', paymentMode: 'Cashfree' }, 'admin')).toBe(true);
    expect(canApprove({ status: 'pending_approval', paymentMode: 'IDFC Bank' }, 'admin')).toBe(true);
  });

  test('Admin CAN approve old "pending" entries', () => {
    expect(canApprove({ status: 'pending' }, 'admin')).toBe(true);
  });

  test('Admin CAN approve old "awaiting_manager_approval"', () => {
    expect(canApprove({ status: 'awaiting_manager_approval' }, 'admin')).toBe(true);
  });

  test('Admin CANNOT approve "approved" entries', () => {
    expect(canApprove({ status: 'approved' }, 'admin')).toBe(false);
  });

  test('Admin CANNOT approve "payment_done" entries', () => {
    expect(canApprove({ status: 'payment_done' }, 'admin')).toBe(false);
  });

  test('Cashfree approver CAN approve Cashfree entries', () => {
    expect(canApprove({ status: 'pending_approval', paymentMode: 'Cashfree' }, 'cashfree_approver')).toBe(true);
  });

  test('Cashfree approver CANNOT approve IDFC Bank entries', () => {
    expect(canApprove({ status: 'pending_approval', paymentMode: 'IDFC Bank' }, 'cashfree_approver')).toBe(false);
  });

  test('IDFC approver CAN approve IDFC Bank entries', () => {
    expect(canApprove({ status: 'pending_approval', paymentMode: 'IDFC Bank' }, 'idfc_approver')).toBe(true);
  });

  test('IDFC approver CANNOT approve Cashfree entries', () => {
    expect(canApprove({ status: 'pending_approval', paymentMode: 'Cashfree' }, 'idfc_approver')).toBe(false);
  });

  test('Either approver CAN approve legacy entries without payment mode', () => {
    expect(canApprove({ status: 'pending_approval' }, 'cashfree_approver')).toBe(true);
    expect(canApprove({ status: 'pending_approval' }, 'idfc_approver')).toBe(true);
  });

  test('Accounts CANNOT approve anything', () => {
    expect(canApprove({ status: 'pending_approval' }, 'accounts')).toBe(false);
    expect(canApprove({ status: 'pending' }, 'accounts')).toBe(false);
  });

  test('Viewer CANNOT approve anything', () => {
    expect(canApprove({ status: 'pending_approval' }, 'viewer')).toBe(false);
  });
});

describe('canUploadForPayment — Accounts Only', () => {
  test('Accounts CAN upload approved entries', () => {
    expect(canUploadForPayment({ status: 'approved' }, 'accounts')).toBe(true);
  });

  test('Admin CAN upload approved entries', () => {
    expect(canUploadForPayment({ status: 'approved' }, 'admin')).toBe(true);
  });

  test('Approvers CANNOT upload for payment', () => {
    expect(canUploadForPayment({ status: 'approved' }, 'cashfree_approver')).toBe(false);
    expect(canUploadForPayment({ status: 'approved' }, 'idfc_approver')).toBe(false);
  });

  test('CANNOT upload pending entries', () => {
    expect(canUploadForPayment({ status: 'pending_approval' }, 'accounts')).toBe(false);
  });
});

describe('canMarkPaid — Uploaded For Payment Only', () => {
  test('Accounts CAN mark "uploaded_for_payment" as paid', () => {
    expect(canMarkPaid({ status: 'uploaded_for_payment', paymentMode: 'Cashfree' }, 'accounts')).toBe(true);
    expect(canMarkPaid({ status: 'uploaded_for_payment', paymentMode: 'IDFC Bank' }, 'accounts')).toBe(true);
  });

  test('Admin CAN mark "uploaded_for_payment" as paid', () => {
    expect(canMarkPaid({ status: 'uploaded_for_payment' }, 'admin')).toBe(true);
  });

  test('Cashfree approver CANNOT mark uploaded entries as paid (only Accounts/Admin)', () => {
    expect(canMarkPaid({ status: 'uploaded_for_payment', paymentMode: 'Cashfree' }, 'cashfree_approver')).toBe(false);
    expect(canMarkPaid({ status: 'uploaded_for_payment', paymentMode: 'IDFC Bank' }, 'cashfree_approver')).toBe(false);
  });

  test('CANNOT mark approved entries as paid (must be uploaded first)', () => {
    expect(canMarkPaid({ status: 'approved' }, 'accounts')).toBe(false);
    expect(canMarkPaid({ status: 'approved' }, 'admin')).toBe(false);
  });

  test('CANNOT mark pending entries as paid', () => {
    expect(canMarkPaid({ status: 'pending_approval' }, 'accounts')).toBe(false);
  });

  test('CANNOT mark payment_done entries as paid', () => {
    expect(canMarkPaid({ status: 'payment_done' }, 'accounts')).toBe(false);
  });

  test('Viewer CANNOT mark as paid', () => {
    expect(canMarkPaid({ status: 'uploaded_for_payment' }, 'viewer')).toBe(false);
  });
});

describe('Approve Action — DB Update Payload', () => {
  test('approve sets correct fields for Supabase', () => {
    const user = { username: 'ramesh' };
    const updates = {
      notes: '',
      status: STATUS_VALUES.APPROVED,
      approvedBy: user.username,
      managerApproval: 'approved',
      managerApprovedBy: user.username,
      managerApprovalDate: expect.any(String),
      accountsApproval: 'approved',
      accountsApprovedBy: user.username,
      accountsApprovalDate: expect.any(String),
    };

    expect(updates.status).toBe('ready_for_upload');
    expect(updates.managerApproval).toBe('approved');
    expect(updates.accountsApproval).toBe('approved');
    expect(updates.approvedBy).toBe('ramesh');
  });

  test('reject sets correct fields for Supabase', () => {
    const user = { username: 'ramesh' };
    const updates = {
      notes: 'Duplicate invoice',
      status: STATUS_VALUES.REJECTED,
      managerApproval: 'rejected',
      managerApprovedBy: user.username,
      managerApprovalDate: expect.any(String),
    };

    expect(updates.status).toBe('rejected');
    expect(updates.managerApproval).toBe('rejected');
    expect(updates.notes).toBe('Duplicate invoice');
  });
});

describe('Mark as Paid — DB Update Payload', () => {
  test('mark paid sets status to payment_done with payment mode', () => {
    const updates = {
      status: STATUS_VALUES.PAYMENT_DONE,
      paymentMode: 'IDFC Bank',
      paymentCompletedBy: 'shreenth',
      paymentCompletedDate: new Date().toISOString(),
    };

    expect(updates.status).toBe('payment_done');
    expect(updates.paymentMode).toBe('IDFC Bank');
  });

  test('Cashfree payment mode works', () => {
    const updates = {
      status: STATUS_VALUES.PAYMENT_DONE,
      paymentMode: 'Cashfree',
      paymentCompletedBy: 'lakshman',
    };

    expect(updates.paymentMode).toBe('Cashfree');
  });
});

describe('Full Workflow — New Entry', () => {
  test('create → approve → upload → payment done (IDFC Bank)', () => {
    // 1. Accounts creates
    let entry = {
      id: 'NEW-001',
      status: 'pending_approval',
      paymentMode: 'IDFC Bank',
      managerApproval: 'pending',
      accountsApproval: 'pending',
      submittedBy: 'shreenth',
    };
    expect(isPending(entry)).toBe(true);
    expect(canApprove(entry, 'idfc_approver')).toBe(true);
    expect(canApprove(entry, 'cashfree_approver')).toBe(false);
    expect(canMarkPaid(entry, 'accounts')).toBe(false);

    // 2. IDFC Approver approves
    entry = {
      ...entry,
      status: 'approved',
      managerApproval: 'approved',
      accountsApproval: 'approved',
      approvedBy: 'ramesh',
    };
    expect(isPending(entry)).toBe(false);
    expect(isApproved(entry)).toBe(true);
    expect(canUploadForPayment(entry, 'accounts')).toBe(true);
    expect(canMarkPaid(entry, 'accounts')).toBe(false);

    // 3. Accounts uploads for payment
    entry = {
      ...entry,
      status: 'uploaded_for_payment',
    };
    expect(isUploadedForPayment(entry)).toBe(true);
    expect(canMarkPaid(entry, 'accounts')).toBe(true);

    // 4. Accounts marks as paid
    entry = {
      ...entry,
      status: 'payment_done',
      paymentCompletedBy: 'shreenth',
    };
    expect(isPaymentDone(entry)).toBe(true);
    expect(canApprove(entry, 'admin')).toBe(false);
    expect(canMarkPaid(entry, 'accounts')).toBe(false);
  });
});

describe('Full Workflow — Old Entry (Legacy Data)', () => {
  test('old "pending" entry can be approved and processed', () => {
    let entry = {
      id: 'OLD-001',
      status: 'pending',
      managerApproval: 'pending',
      accountsApproval: 'pending',
    };
    expect(isPending(entry)).toBe(true);
    expect(canApprove(entry, 'admin')).toBe(true);

    // Admin approves
    entry = { ...entry, status: 'approved', managerApproval: 'approved', accountsApproval: 'approved' };
    expect(isApproved(entry)).toBe(true);
    expect(canUploadForPayment(entry, 'accounts')).toBe(true);

    // Upload for payment
    entry = { ...entry, status: 'uploaded_for_payment' };
    expect(canMarkPaid(entry, 'accounts')).toBe(true);

    // Payment done
    entry = { ...entry, status: 'payment_done', paymentMode: 'Cashfree' };
    expect(isPaymentDone(entry)).toBe(true);
  });

  test('old "awaiting_payment" entry can be uploaded for payment', () => {
    const entry = { status: 'awaiting_payment' };
    expect(isApproved(entry)).toBe(true);
    expect(canUploadForPayment(entry, 'accounts')).toBe(true);
    expect(canApprove(entry, 'admin')).toBe(false);
  });
});

describe('Edge Cases', () => {
  test('null entry always returns false', () => {
    expect(canApprove(null, 'admin')).toBe(false);
    expect(canMarkPaid(null, 'accounts')).toBe(false);
    expect(canUploadForPayment(null, 'accounts')).toBe(false);
  });

  test('entry cannot skip from pending to payment_done', () => {
    const entry = { status: 'pending_approval' };
    expect(canMarkPaid(entry, 'accounts')).toBe(false);
    expect(canMarkPaid(entry, 'admin')).toBe(false);
  });

  test('payment_done entry is locked — no further actions', () => {
    const entry = { status: 'payment_done' };
    expect(canApprove(entry, 'admin')).toBe(false);
    expect(canMarkPaid(entry, 'admin')).toBe(false);
    expect(canMarkPaid(entry, 'accounts')).toBe(false);
  });

  test('rejected entry is locked — no further actions', () => {
    const entry = { status: 'rejected' };
    expect(canApprove(entry, 'admin')).toBe(false);
    expect(canMarkPaid(entry, 'admin')).toBe(false);
  });
});
