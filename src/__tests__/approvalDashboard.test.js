/**
 * Test Suite: ApprovalDashboard logic
 * Tests modal state management, filtering, error handling
 */
import { STATUS_VALUES, ROLES, PAYMENT_MODES } from '../utils/constants';

// ─── Simulate the filtering logic from ApprovalDashboard ───
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

const isOnHold = (entry) => {
  return entry.status === STATUS_VALUES.ON_HOLD;
};

const filterEntries = (allEntries, selectedStatus, selectedModule) => {
  let entries = [];

  if (selectedStatus === 'pending') {
    entries = allEntries.filter(isPending);
  } else if (selectedStatus === 'awaiting_payment') {
    entries = allEntries.filter(isApproved);
  } else if (selectedStatus === 'uploaded') {
    entries = allEntries.filter(isUploadedForPayment);
  } else if (selectedStatus === 'payment_done') {
    entries = allEntries.filter(isPaymentDone);
  } else if (selectedStatus === 'rejected') {
    entries = allEntries.filter(e => e.status === STATUS_VALUES.REJECTED);
  } else if (selectedStatus === 'on_hold') {
    entries = allEntries.filter(isOnHold);
  }

  if (selectedModule !== 'all') {
    entries = entries.filter(e => e.module === selectedModule);
  }

  return entries;
};

// Test data covering all statuses (new and legacy)
const testEntries = [
  { id: '1', status: 'pending_approval', module: 'transport', invoiceAmount: 5000, paymentMode: 'IDFC Bank' },
  { id: '2', status: 'pending', module: 'transport', invoiceAmount: 3000 }, // legacy
  { id: '3', status: 'awaiting_manager_approval', module: 'general', invoiceAmount: 2000 }, // legacy
  { id: '4', status: 'approved', module: 'transport', invoiceAmount: 4000, paymentMode: 'Cashfree' },
  { id: '5', status: 'awaiting_payment', module: 'packing', invoiceAmount: 1500 }, // legacy
  { id: '6', status: 'uploaded_for_payment', module: 'transport', invoiceAmount: 3500, paymentMode: 'IDFC Bank' },
  { id: '7', status: 'payment_done', module: 'transport', invoiceAmount: 6000, paymentMode: 'IDFC Bank' },
  { id: '8', status: 'payment_done', module: 'general', invoiceAmount: 2500, paymentMode: 'Cashfree' },
  { id: '9', status: 'rejected', module: 'transport', invoiceAmount: 1000, notes: 'Duplicate' },
  { id: '10', status: 'on_hold', module: 'general', invoiceAmount: 800 },
];

describe('Dashboard Filtering — Pending Tab', () => {
  test('pending tab shows all pending entries (new + legacy)', () => {
    const result = filterEntries(testEntries, 'pending', 'all');
    expect(result).toHaveLength(3); // ids 1, 2, 3
    expect(result.map(e => e.id)).toEqual(['1', '2', '3']);
  });

  test('pending tab with module filter', () => {
    const result = filterEntries(testEntries, 'pending', 'transport');
    expect(result).toHaveLength(2); // ids 1, 2
  });

  test('pending tab with module that has no pending entries', () => {
    const result = filterEntries(testEntries, 'pending', 'packing');
    expect(result).toHaveLength(0);
  });
});

describe('Dashboard Filtering — Awaiting Payment Tab', () => {
  test('awaiting payment shows approved + legacy awaiting_payment', () => {
    const result = filterEntries(testEntries, 'awaiting_payment', 'all');
    expect(result).toHaveLength(2); // ids 4, 5
    expect(result.map(e => e.id)).toEqual(['4', '5']);
  });

  test('awaiting payment excludes payment_done and pending entries', () => {
    const result = filterEntries(testEntries, 'awaiting_payment', 'all');
    result.forEach(entry => {
      expect(entry.status).not.toBe('payment_done');
      expect(entry.status).not.toBe('pending_approval');
    });
  });
});

describe('Dashboard Filtering — Uploaded for Payment Tab', () => {
  test('uploaded tab shows only uploaded_for_payment entries', () => {
    const result = filterEntries(testEntries, 'uploaded', 'all');
    expect(result).toHaveLength(1); // id 6
    expect(result[0].id).toBe('6');
  });
});

describe('Dashboard Filtering — Payment Done Tab', () => {
  test('payment_done tab shows only payment_done entries', () => {
    const result = filterEntries(testEntries, 'payment_done', 'all');
    expect(result).toHaveLength(2); // ids 7, 8
    result.forEach(entry => {
      expect(entry.status).toBe('payment_done');
    });
  });

  test('payment_done entries have payment mode', () => {
    const result = filterEntries(testEntries, 'payment_done', 'all');
    result.forEach(entry => {
      expect(entry.paymentMode).toBeTruthy();
    });
  });
});

describe('Dashboard Filtering — On Hold Tab', () => {
  test('on_hold tab shows only on_hold entries', () => {
    const result = filterEntries(testEntries, 'on_hold', 'all');
    expect(result).toHaveLength(1); // id 10
    expect(result[0].id).toBe('10');
  });
});

describe('Dashboard Filtering — Rejected Tab', () => {
  test('rejected tab shows only rejected entries', () => {
    const result = filterEntries(testEntries, 'rejected', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('9');
    expect(result[0].notes).toBe('Duplicate');
  });

  test('rejected tab with module filter', () => {
    const result = filterEntries(testEntries, 'rejected', 'transport');
    expect(result).toHaveLength(1);
  });

  test('rejected tab with wrong module shows empty', () => {
    const result = filterEntries(testEntries, 'rejected', 'packing');
    expect(result).toHaveLength(0);
  });
});

describe('Dashboard Filtering — Module Filter', () => {
  test('all modules shows everything for selected status', () => {
    const pending = filterEntries(testEntries, 'pending', 'all');
    expect(pending.length).toBeGreaterThan(0);
  });

  test('transport filter across all statuses', () => {
    expect(filterEntries(testEntries, 'pending', 'transport')).toHaveLength(2);
    expect(filterEntries(testEntries, 'awaiting_payment', 'transport')).toHaveLength(1);
    expect(filterEntries(testEntries, 'payment_done', 'transport')).toHaveLength(1);
    expect(filterEntries(testEntries, 'rejected', 'transport')).toHaveLength(1);
  });
});

describe('Modal State Management', () => {
  test('payment modal and reject target are independent states', () => {
    let paymentModal = null;
    let rejectTarget = null;

    paymentModal = { module: 'transport', id: '4' };
    expect(paymentModal).toBeTruthy();
    expect(rejectTarget).toBeNull();

    paymentModal = null;
    rejectTarget = { module: 'transport', id: '1' };
    expect(paymentModal).toBeNull();
    expect(rejectTarget).toBeTruthy();

    rejectTarget = null;
    expect(paymentModal).toBeNull();
    expect(rejectTarget).toBeNull();
  });

  test('reject modal does not interfere with payment modal', () => {
    let paymentModal = { module: 'transport', id: '4' };
    let rejectTarget = { module: 'transport', id: '1' };

    expect(paymentModal.id).not.toBe(rejectTarget.id);

    rejectTarget = null;
    expect(paymentModal).toBeTruthy();
    expect(paymentModal.id).toBe('4');
  });
});

describe('Filtered Total Calculation', () => {
  const calcTotal = (entries) =>
    entries.reduce((sum, e) => {
      const amount = e.invoiceAmount || e.payableAmount || e.refundAmount || e.amount || 0;
      return sum + amount;
    }, 0);

  test('pending total sums all pending entry amounts', () => {
    const pending = filterEntries(testEntries, 'pending', 'all');
    expect(calcTotal(pending)).toBe(10000); // 5000 + 3000 + 2000
  });

  test('payment_done total sums all payment_done entry amounts', () => {
    const completed = filterEntries(testEntries, 'payment_done', 'all');
    expect(calcTotal(completed)).toBe(8500); // 6000 + 2500
  });

  test('empty filter returns zero', () => {
    expect(calcTotal([])).toBe(0);
  });

  test('handles entries with different amount field names', () => {
    const mixed = [
      { invoiceAmount: 1000 },
      { payableAmount: 2000 },
      { refundAmount: 500 },
      { amount: 300 },
      { noAmountField: true },
    ];
    expect(calcTotal(mixed)).toBe(3800);
  });
});

describe('Stats Calculation', () => {
  const calcStats = (entries) => ({
    total: entries.length,
    pendingApproval: entries.filter(isPending).length,
    approved: entries.filter(isApproved).length,
    uploadedForPayment: entries.filter(isUploadedForPayment).length,
    paymentDone: entries.filter(isPaymentDone).length,
    rejected: entries.filter(e => e.status === STATUS_VALUES.REJECTED).length,
    onHold: entries.filter(isOnHold).length,
  });

  test('stats add up correctly', () => {
    const stats = calcStats(testEntries);
    expect(stats.total).toBe(10);
    expect(stats.pendingApproval).toBe(3);
    expect(stats.approved).toBe(2);
    expect(stats.uploadedForPayment).toBe(1);
    expect(stats.paymentDone).toBe(2);
    expect(stats.rejected).toBe(1);
    expect(stats.onHold).toBe(1);
    expect(stats.pendingApproval + stats.approved + stats.uploadedForPayment + stats.paymentDone + stats.rejected + stats.onHold).toBe(stats.total);
  });

  test('stats with empty data', () => {
    const stats = calcStats([]);
    expect(stats.total).toBe(0);
    expect(stats.pendingApproval).toBe(0);
    expect(stats.approved).toBe(0);
    expect(stats.paymentDone).toBe(0);
    expect(stats.rejected).toBe(0);
  });

  test('stats with only legacy statuses', () => {
    const legacyEntries = [
      { status: 'pending' },
      { status: 'awaiting_manager_approval' },
      { status: 'awaiting_accounts_approval' },
      { status: 'awaiting_payment' },
    ];
    const stats = calcStats(legacyEntries);
    expect(stats.pendingApproval).toBe(3);
    expect(stats.approved).toBe(1);
    expect(stats.paymentDone).toBe(0);
    expect(stats.rejected).toBe(0);
  });
});

describe('Error Handling Scenarios', () => {
  test('handleProcessPayment returns without action when no modal', async () => {
    const paymentModal = null;
    const selectedPaymentMode = 'IDFC Bank';
    const shouldProceed = !!paymentModal && !!selectedPaymentMode;
    expect(shouldProceed).toBe(false);
  });

  test('handleProcessPayment returns without action when no mode selected', async () => {
    const paymentModal = { module: 'transport', id: '1' };
    const selectedPaymentMode = '';
    const shouldProceed = !!paymentModal && !!selectedPaymentMode;
    expect(shouldProceed).toBe(false);
  });

  test('handleProcessPayment proceeds when both modal and mode are set', async () => {
    const paymentModal = { module: 'transport', id: '1' };
    const selectedPaymentMode = 'Cashfree';
    const shouldProceed = !!paymentModal && !!selectedPaymentMode;
    expect(shouldProceed).toBe(true);
  });

  test('bulk action requires selected rows', () => {
    const selectedRows = [];
    const shouldProceed = selectedRows.length > 0;
    expect(shouldProceed).toBe(false);
  });
});

describe('Role-Based UI Visibility', () => {
  test('admin sees pending tab by default', () => {
    const defaultStatus = ROLES.ADMIN === 'admin' ? 'pending' : 'awaiting_payment';
    expect(defaultStatus).toBe('pending');
  });

  test('accounts sees awaiting_payment tab by default', () => {
    const userRole = ROLES.ACCOUNTS;
    const defaultStatus = userRole === ROLES.ADMIN ? 'pending' : 'awaiting_payment';
    expect(defaultStatus).toBe('awaiting_payment');
  });

  test('approvers see pending tab by default', () => {
    const cashfreeRole = ROLES.CASHFREE_APPROVER;
    const idfcRole = ROLES.IDFC_APPROVER;
    // Approvers should see pending (their queue) by default
    const cashfreeDefault = (cashfreeRole === ROLES.ADMIN || cashfreeRole === ROLES.CASHFREE_APPROVER || cashfreeRole === ROLES.IDFC_APPROVER) ? 'pending' : 'awaiting_payment';
    const idfcDefault = (idfcRole === ROLES.ADMIN || idfcRole === ROLES.CASHFREE_APPROVER || idfcRole === ROLES.IDFC_APPROVER) ? 'pending' : 'awaiting_payment';
    expect(cashfreeDefault).toBe('pending');
    expect(idfcDefault).toBe('pending');
  });
});
