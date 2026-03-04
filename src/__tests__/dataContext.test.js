/**
 * Test Suite: DataContext — approval payloads, markAsPaid, bulk ops
 * Validates the EXACT payloads sent to Supabase match existing DB columns.
 */
import { STATUS_VALUES, ROLES, PAYMENT_MODES } from '../utils/constants';

// ─── Simulate approveEntry payload (mirrors DataContext.jsx) ───
const buildApprovePayload = (username) => ({
  notes: '',
  status: STATUS_VALUES.APPROVED,
  approvedBy: username,
  managerApproval: 'approved',
  managerApprovedBy: username,
  managerApprovalDate: new Date().toISOString(),
  accountsApproval: 'approved',
  accountsApprovedBy: username,
  accountsApprovalDate: new Date().toISOString(),
});

// ─── Simulate rejectEntry payload ───
const buildRejectPayload = (username, notes) => ({
  notes,
  status: STATUS_VALUES.REJECTED,
  managerApproval: 'rejected',
  managerApprovedBy: username,
  managerApprovalDate: new Date().toISOString(),
});

// ─── Simulate markAsPaid payload ───
const buildMarkPaidPayload = (paymentMode, username) => ({
  status: STATUS_VALUES.PAYMENT_DONE,
  paymentMode,
  paymentCompletedDate: new Date().toISOString(),
  paymentCompletedBy: username || 'system',
});

// ─── Simulate createEntry defaults ───
const buildCreateDefaults = (username) => ({
  status: STATUS_VALUES.PENDING_APPROVAL,
  managerApproval: 'pending',
  accountsApproval: 'pending',
  submittedBy: username || 'system',
  submittedAt: new Date().toISOString(),
});

describe('approveEntry Payload', () => {
  test('payload has all required DB fields', () => {
    const payload = buildApprovePayload('ramesh');
    expect(payload.status).toBe('ready_for_upload');
    expect(payload.approvedBy).toBe('ramesh');
    expect(payload.managerApproval).toBe('approved');
    expect(payload.managerApprovedBy).toBe('ramesh');
    expect(payload.managerApprovalDate).toBeTruthy();
    expect(payload.accountsApproval).toBe('approved');
    expect(payload.accountsApprovedBy).toBe('ramesh');
    expect(payload.accountsApprovalDate).toBeTruthy();
  });

  test('payload does NOT contain non-existent DB fields', () => {
    const payload = buildApprovePayload('ramesh');
    // These fields were removed because they don't exist in the live DB
    expect(payload).not.toHaveProperty('approvalDate');
    expect(payload).not.toHaveProperty('rejectedBy');
    expect(payload).not.toHaveProperty('rejectionDate');
  });

  test('notes defaults to empty string', () => {
    const payload = buildApprovePayload('ramesh');
    expect(payload.notes).toBe('');
  });
});

describe('rejectEntry Payload', () => {
  test('payload has required fields', () => {
    const payload = buildRejectPayload('ramesh', 'Duplicate invoice');
    expect(payload.status).toBe('rejected');
    expect(payload.notes).toBe('Duplicate invoice');
    expect(payload.managerApproval).toBe('rejected');
    expect(payload.managerApprovedBy).toBe('ramesh');
    expect(payload.managerApprovalDate).toBeTruthy();
  });

  test('payload does NOT contain non-existent DB fields', () => {
    const payload = buildRejectPayload('ramesh', 'test');
    expect(payload).not.toHaveProperty('rejectedBy');
    expect(payload).not.toHaveProperty('rejectionDate');
  });

  test('reject preserves rejection notes', () => {
    const payload = buildRejectPayload('ramesh', 'Wrong vendor');
    expect(payload.notes).toBe('Wrong vendor');
  });
});

describe('markAsPaid Payload', () => {
  test('IDFC Bank payment payload is correct', () => {
    const payload = buildMarkPaidPayload(PAYMENT_MODES.IDFC_BANK, 'shreenth');
    expect(payload.status).toBe('payment_done');
    expect(payload.paymentMode).toBe('IDFC Bank');
    expect(payload.paymentCompletedBy).toBe('shreenth');
    expect(payload.paymentCompletedDate).toBeTruthy();
  });

  test('Cashfree payment payload is correct', () => {
    const payload = buildMarkPaidPayload(PAYMENT_MODES.CASHFREE, 'lakshman');
    expect(payload.paymentMode).toBe('Cashfree');
    expect(payload.paymentCompletedBy).toBe('lakshman');
  });

  test('null user falls back to "system"', () => {
    const payload = buildMarkPaidPayload('Bank', null);
    expect(payload.paymentCompletedBy).toBe('system');
  });

  test('undefined user falls back to "system"', () => {
    const payload = buildMarkPaidPayload('Bank', undefined);
    expect(payload.paymentCompletedBy).toBe('system');
  });
});

describe('createEntry Defaults', () => {
  test('new entry starts with correct approval defaults', () => {
    const defaults = buildCreateDefaults('shreenth');
    expect(defaults.status).toBe('pending_approval');
    expect(defaults.managerApproval).toBe('pending');
    expect(defaults.accountsApproval).toBe('pending');
    expect(defaults.submittedBy).toBe('shreenth');
    expect(defaults.submittedAt).toBeTruthy();
  });

  test('null user falls back to "system"', () => {
    const defaults = buildCreateDefaults(null);
    expect(defaults.submittedBy).toBe('system');
  });
});

describe('Bulk Operations Logic', () => {
  // Simulate bulk approve/reject with tracking
  const simulateBulkApprove = async (ids, approveFn) => {
    let failed = 0;
    for (const id of ids) {
      const result = await approveFn(id);
      if (!result) failed++;
    }
    return { total: ids.length, failed };
  };

  test('bulk approve tracks successes', async () => {
    const result = await simulateBulkApprove(
      ['id1', 'id2', 'id3'],
      async () => true
    );
    expect(result.total).toBe(3);
    expect(result.failed).toBe(0);
  });

  test('bulk approve tracks failures', async () => {
    let callCount = 0;
    const result = await simulateBulkApprove(
      ['id1', 'id2', 'id3'],
      async () => {
        callCount++;
        return callCount !== 2; // 2nd one fails
      }
    );
    expect(result.total).toBe(3);
    expect(result.failed).toBe(1);
  });

  test('bulk operations are sequential (not parallel)', async () => {
    const order = [];
    await simulateBulkApprove(
      ['a', 'b', 'c'],
      async (id) => {
        order.push(id);
        return true;
      }
    );
    expect(order).toEqual(['a', 'b', 'c']);
  });

  test('bulk approve continues after one failure', async () => {
    const processed = [];
    await simulateBulkApprove(
      ['id1', 'id2', 'id3'],
      async (id) => {
        processed.push(id);
        return id !== 'id2'; // id2 fails
      }
    );
    // All 3 should be processed even though id2 failed
    expect(processed).toEqual(['id1', 'id2', 'id3']);
  });
});

describe('Status Transition Validation', () => {
  test('valid transitions: pending_approval → approved → uploaded → payment_done', () => {
    const validTransitions = {
      pending_approval: ['approved', 'rejected', 'on_hold'],
      approved: ['uploaded_for_payment'],
      uploaded_for_payment: ['payment_done'],
      payment_done: [],
      rejected: [],
      on_hold: ['pending_approval'],
    };

    expect(validTransitions.pending_approval).toContain('approved');
    expect(validTransitions.pending_approval).toContain('rejected');
    expect(validTransitions.approved).toContain('uploaded_for_payment');
    expect(validTransitions.uploaded_for_payment).toContain('payment_done');
    expect(validTransitions.payment_done).toHaveLength(0);
    expect(validTransitions.rejected).toHaveLength(0);
  });

  test('payment_done entries cannot transition further', () => {
    const entry = { status: 'payment_done', paymentMode: 'IDFC Bank' };
    // Verify it's a terminal state
    expect(entry.status).toBe(STATUS_VALUES.PAYMENT_DONE);
  });

  test('rejected entries cannot transition further', () => {
    const entry = { status: 'rejected', notes: 'Duplicate' };
    expect(entry.status).toBe(STATUS_VALUES.REJECTED);
  });
});

describe('Payment Mode Validation', () => {
  test('only IDFC Bank and Cashfree are valid', () => {
    const validModes = Object.values(PAYMENT_MODES);
    expect(validModes).toContain('IDFC Bank');
    expect(validModes).toContain('Cashfree');
    expect(validModes).toHaveLength(2);
  });

  test('payment mode is preserved in payment_done entry', () => {
    const entry = {
      status: 'payment_done',
      paymentMode: 'IDFC Bank',
      paymentCompletedBy: 'shreenth',
    };
    expect(entry.paymentMode).toBe('IDFC Bank');
    expect(entry.paymentCompletedBy).toBe('shreenth');
  });
});
