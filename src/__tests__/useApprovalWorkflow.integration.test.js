/**
 * Integration Test: useApprovalWorkflow hook
 * Uses renderHook with real AuthContext and mocked DataContext
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import useApprovalWorkflow from '../hooks/useApprovalWorkflow';
import AuthContext from '../contexts/AuthContext';
import DataContext from '../contexts/DataContext';

// ─── Test Helpers ───

const createMockAuth = (role) => ({
  user: { username: role === 'admin' ? 'admin' : role === 'idfc_approver' ? 'ramesh' : role === 'cashfree_approver' ? 'anush' : 'shreenth', role },
  hasRole: (roles) => {
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(role);
  },
  loading: false,
  error: null,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  hasPermission: jest.fn(),
  hasModuleAccess: jest.fn(),
  refreshSession: jest.fn(),
});

const createMockData = (entries) => ({
  getAllEntries: () => entries,
  approveEntry: jest.fn().mockResolvedValue(true),
  rejectEntry: jest.fn().mockResolvedValue(true),
  markAsPaid: jest.fn().mockResolvedValue(true),
  uploadForPayment: jest.fn().mockResolvedValue(true),
  putOnHold: jest.fn().mockResolvedValue(true),
  transportInvoices: [], generalBills: [], packingMaterials: [],
  pettyCash: [], happyCard: [], refunds: [], driveTrackPorter: [], reviews: [],
  loading: false, error: null,
  createEntry: jest.fn(), updateEntry: jest.fn(), deleteEntry: jest.fn(),
  bulkApprove: jest.fn(), bulkReject: jest.fn(),
});

const createWrapper = (authValue, dataValue) => {
  return ({ children }) => (
    <AuthContext.Provider value={authValue}>
      <DataContext.Provider value={dataValue}>
        {children}
      </DataContext.Provider>
    </AuthContext.Provider>
  );
};

// ─── Test Data ───
const testEntries = [
  { id: '1', status: 'pending_approval', module: 'transport', vendorName: 'ABC', paymentMode: 'Cashfree' },
  { id: '2', status: 'pending', module: 'general', vendorName: 'DEF' }, // legacy
  { id: '3', status: 'awaiting_manager_approval', module: 'packing', vendorName: 'GHI' }, // legacy
  { id: '4', status: 'approved', module: 'transport', vendorName: 'JKL', paymentMode: 'IDFC Bank' },
  { id: '5', status: 'awaiting_payment', module: 'petty', vendorName: 'MNO' }, // legacy
  { id: '6', status: 'uploaded_for_payment', module: 'transport', vendorName: 'PQR', paymentMode: 'IDFC Bank' },
  { id: '7', status: 'payment_done', module: 'transport', vendorName: 'STU', paymentMode: 'IDFC Bank' },
  { id: '8', status: 'rejected', module: 'general', vendorName: 'VWX', notes: 'Duplicate' },
  { id: '9', status: 'on_hold', module: 'packing', vendorName: 'YZA' },
];

// ─── Tests ───

describe('useApprovalWorkflow — Entry Filtering', () => {
  const authValue = createMockAuth('admin');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('pendingApprovalEntries includes new and legacy pending statuses', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.pendingApprovalEntries).toHaveLength(3);
    expect(result.current.pendingApprovalEntries.map(e => e.id)).toEqual(['1', '2', '3']);
  });

  test('awaitingPaymentEntries includes approved and legacy awaiting_payment', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.awaitingPaymentEntries).toHaveLength(2);
    expect(result.current.awaitingPaymentEntries.map(e => e.id)).toEqual(['4', '5']);
  });

  test('uploadedForPaymentEntries includes only uploaded_for_payment', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.uploadedForPaymentEntries).toHaveLength(1);
    expect(result.current.uploadedForPaymentEntries[0].id).toBe('6');
  });

  test('completedEntries (paymentDoneEntries) includes payment_done', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.paymentDoneEntries).toHaveLength(1);
    expect(result.current.paymentDoneEntries[0].id).toBe('7');
  });

  test('rejectedEntries includes only rejected', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.rejectedEntries).toHaveLength(1);
    expect(result.current.rejectedEntries[0].id).toBe('8');
  });

  test('onHoldEntries includes only on_hold', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.onHoldEntries).toHaveLength(1);
    expect(result.current.onHoldEntries[0].id).toBe('9');
  });

  test('approvedEntries includes approved + awaiting_payment + uploaded + payment_done', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.approvedEntries).toHaveLength(4); // ids 4, 5, 6, 7
  });
});

describe('useApprovalWorkflow — Stats', () => {
  const authValue = createMockAuth('admin');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('stats counts are correct', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.stats.total).toBe(9);
    expect(result.current.stats.pendingApproval).toBe(3);
    expect(result.current.stats.approved).toBe(2);
    expect(result.current.stats.uploadedForPayment).toBe(1);
    expect(result.current.stats.closed).toBe(1);
    expect(result.current.stats.rejected).toBe(1);
    expect(result.current.stats.onHold).toBe(1);
  });

  test('stats with empty data', () => {
    const emptyData = createMockData([]);
    const w = createWrapper(authValue, emptyData);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper: w });
    expect(result.current.stats.total).toBe(0);
    expect(result.current.stats.pendingApproval).toBe(0);
  });
});

describe('useApprovalWorkflow — canApprove (Admin)', () => {
  const authValue = createMockAuth('admin');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('admin CAN approve pending_approval entries', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending_approval' })).toBe(true);
  });

  test('admin CAN approve legacy pending entries', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending' })).toBe(true);
    expect(result.current.canApprove({ status: 'awaiting_manager_approval' })).toBe(true);
    expect(result.current.canApprove({ status: 'awaiting_accounts_approval' })).toBe(true);
  });

  test('admin CANNOT approve non-pending entries', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'approved' })).toBe(false);
    expect(result.current.canApprove({ status: 'payment_done' })).toBe(false);
    expect(result.current.canApprove({ status: 'rejected' })).toBe(false);
  });

  test('canApprove returns false for null entry', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove(null)).toBe(false);
  });
});

describe('useApprovalWorkflow — canApprove (Cashfree Approver)', () => {
  const authValue = createMockAuth('cashfree_approver');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('cashfree approver CAN approve Cashfree entries', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending_approval', paymentMode: 'Cashfree' })).toBe(true);
  });

  test('cashfree approver CANNOT approve IDFC Bank entries', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending_approval', paymentMode: 'IDFC Bank' })).toBe(false);
  });

  test('cashfree approver CAN approve legacy entries without payment mode', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending_approval' })).toBe(true);
  });
});

describe('useApprovalWorkflow — canApprove (Accounts)', () => {
  const authValue = createMockAuth('accounts');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('accounts CANNOT approve any entry', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending_approval' })).toBe(false);
    expect(result.current.canApprove({ status: 'pending' })).toBe(false);
  });
});

describe('useApprovalWorkflow — canApprove (Viewer)', () => {
  const authValue = createMockAuth('viewer');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('viewer CANNOT approve any entry', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canApprove({ status: 'pending_approval' })).toBe(false);
  });
});

describe('useApprovalWorkflow — canUploadForPayment', () => {
  test('accounts CAN upload approved entries for payment', () => {
    const authValue = createMockAuth('accounts');
    const dataValue = createMockData(testEntries);
    const wrapper = createWrapper(authValue, dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canUploadForPayment({ status: 'approved' })).toBe(true);
    expect(result.current.canUploadForPayment({ status: 'awaiting_payment' })).toBe(true);
  });

  test('approvers CANNOT upload for payment', () => {
    const authValue = createMockAuth('cashfree_approver');
    const dataValue = createMockData(testEntries);
    const wrapper = createWrapper(authValue, dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canUploadForPayment({ status: 'approved' })).toBe(false);
  });

  test('CANNOT upload pending entries', () => {
    const authValue = createMockAuth('accounts');
    const dataValue = createMockData(testEntries);
    const wrapper = createWrapper(authValue, dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canUploadForPayment({ status: 'pending_approval' })).toBe(false);
  });
});

describe('useApprovalWorkflow — canMarkPaid (Accounts)', () => {
  const authValue = createMockAuth('accounts');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('accounts CAN mark uploaded_for_payment entries as paid', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canMarkPaid({ status: 'uploaded_for_payment' })).toBe(true);
  });

  test('accounts CANNOT mark approved entries as paid (must upload first)', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canMarkPaid({ status: 'approved' })).toBe(false);
  });

  test('accounts CANNOT mark pending or payment_done entries', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canMarkPaid({ status: 'pending_approval' })).toBe(false);
    expect(result.current.canMarkPaid({ status: 'payment_done' })).toBe(false);
    expect(result.current.canMarkPaid({ status: 'rejected' })).toBe(false);
  });

  test('canMarkPaid returns false for null', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canMarkPaid(null)).toBe(false);
  });
});

describe('useApprovalWorkflow — canMarkPaid (Admin)', () => {
  const authValue = createMockAuth('admin');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('admin CAN mark uploaded_for_payment entries as paid', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canMarkPaid({ status: 'uploaded_for_payment' })).toBe(true);
  });
});

describe('useApprovalWorkflow — canMarkPaid (Viewer)', () => {
  const authValue = createMockAuth('viewer');
  const dataValue = createMockData(testEntries);
  const wrapper = createWrapper(authValue, dataValue);

  test('viewer CANNOT mark as paid', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.canMarkPaid({ status: 'uploaded_for_payment' })).toBe(false);
  });
});

describe('useApprovalWorkflow — myPendingQueue', () => {
  test('cashfree approver sees only Cashfree pending entries', () => {
    const authValue = createMockAuth('cashfree_approver');
    const dataValue = createMockData(testEntries);
    const wrapper = createWrapper(authValue, dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    // Only entry id=1 has paymentMode=Cashfree and is pending
    expect(result.current.myPendingQueue).toHaveLength(1);
    expect(result.current.myPendingQueue[0].id).toBe('1');
  });

  test('admin sees all pending entries', () => {
    const authValue = createMockAuth('admin');
    const dataValue = createMockData(testEntries);
    const wrapper = createWrapper(authValue, dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.myPendingQueue).toHaveLength(3);
  });
});

describe('useApprovalWorkflow — getStatusLabel', () => {
  const authValue = createMockAuth('admin');
  const dataValue = createMockData([]);
  const wrapper = createWrapper(authValue, dataValue);

  test('pending_approval → "Pending Approval"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'pending_approval' })).toBe('Pending Approval');
  });

  test('legacy pending → "Pending Approval"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'pending' })).toBe('Pending Approval');
    expect(result.current.getStatusLabel({ status: 'awaiting_manager_approval' })).toBe('Pending Approval');
  });

  test('approved → "Ready for Upload"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'approved' })).toBe('Ready for Upload');
  });

  test('uploaded_for_payment → "Uploaded to Bank"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'uploaded_for_payment' })).toBe('Uploaded to Bank');
  });

  test('on_hold → "On Hold"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'on_hold' })).toBe('On Hold');
  });

  test('rejected → "Rejected"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'rejected' })).toBe('Rejected');
  });

  test('payment_done with payment mode → includes mode', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'payment_done', paymentMode: 'IDFC Bank' }))
      .toBe('Payment Done (IDFC Bank)');
    expect(result.current.getStatusLabel({ status: 'payment_done', paymentMode: 'Cashfree' }))
      .toBe('Payment Done (Cashfree)');
  });

  test('payment_done without payment mode → no parentheses', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel({ status: 'payment_done' }))
      .toBe('Payment Done');
  });

  test('null entry → "Unknown"', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getStatusLabel(null)).toBe('Unknown');
  });
});

describe('useApprovalWorkflow — getWorkflowStep', () => {
  const authValue = createMockAuth('admin');
  const dataValue = createMockData([]);
  const wrapper = createWrapper(authValue, dataValue);

  test('pending → step 0', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep({ status: 'pending_approval' })).toBe(0);
    expect(result.current.getWorkflowStep({ status: 'pending' })).toBe(0);
  });

  test('approved → step 1', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep({ status: 'approved' })).toBe(1);
    expect(result.current.getWorkflowStep({ status: 'awaiting_payment' })).toBe(1);
  });

  test('uploaded_for_payment → step 2', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep({ status: 'uploaded_for_payment' })).toBe(2);
  });

  test('payment_done → step 3', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep({ status: 'payment_done' })).toBe(3);
  });

  test('rejected → step -1', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep({ status: 'rejected' })).toBe(-1);
  });

  test('on_hold → step -2', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep({ status: 'on_hold' })).toBe(-2);
  });

  test('null → step 0', () => {
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });
    expect(result.current.getWorkflowStep(null)).toBe(0);
  });
});

describe('useApprovalWorkflow — Action Handlers', () => {
  test('handleApprove delegates to DataContext.approveEntry', async () => {
    const dataValue = createMockData([]);
    const wrapper = createWrapper(createMockAuth('admin'), dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });

    await act(async () => {
      await result.current.handleApprove('transport', 'ID-1', 'Looks good');
    });

    expect(dataValue.approveEntry).toHaveBeenCalledWith('transport', 'ID-1', 'Looks good');
  });

  test('handleReject delegates to DataContext.rejectEntry', async () => {
    const dataValue = createMockData([]);
    const wrapper = createWrapper(createMockAuth('admin'), dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });

    await act(async () => {
      await result.current.handleReject('transport', 'ID-1', 'Duplicate');
    });

    expect(dataValue.rejectEntry).toHaveBeenCalledWith('transport', 'ID-1', 'Duplicate');
  });

  test('handleMarkPaid delegates to DataContext.markAsPaid', async () => {
    const dataValue = createMockData([]);
    const wrapper = createWrapper(createMockAuth('accounts'), dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });

    await act(async () => {
      await result.current.handleMarkPaid('transport', 'ID-1', 'IDFC Bank');
    });

    expect(dataValue.markAsPaid).toHaveBeenCalledWith('transport', 'ID-1', 'IDFC Bank');
  });

  test('handleUploadForPayment delegates to DataContext.uploadForPayment', async () => {
    const dataValue = createMockData([]);
    const wrapper = createWrapper(createMockAuth('accounts'), dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });

    await act(async () => {
      await result.current.handleUploadForPayment('transport', 'ID-1');
    });

    expect(dataValue.uploadForPayment).toHaveBeenCalledWith('transport', 'ID-1');
  });

  test('handlePutOnHold delegates to DataContext.putOnHold', async () => {
    const dataValue = createMockData([]);
    const wrapper = createWrapper(createMockAuth('admin'), dataValue);
    const { result } = renderHook(() => useApprovalWorkflow(), { wrapper });

    await act(async () => {
      await result.current.handlePutOnHold('transport', 'ID-1', 'Needs review');
    });

    expect(dataValue.putOnHold).toHaveBeenCalledWith('transport', 'ID-1', 'Needs review');
  });
});
