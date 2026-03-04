/**
 * Integration Test: DataContext
 * Tests approve/reject/markAsPaid/create/delete with mocked Supabase
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { DataProvider, useData } from '../contexts/DataContext';
import AuthContext from '../contexts/AuthContext';
import { STATUS_VALUES } from '../utils/constants';

// Mock supabaseService
const mockInsertBill = jest.fn();
const mockUpdateBill = jest.fn();
const mockDeleteBill = jest.fn();
const mockFetchAllBills = jest.fn();
const mockFetchTransportGroups = jest.fn().mockResolvedValue([]);
const mockFetchAllPayments = jest.fn().mockResolvedValue([]);
const mockInsertBillPayment = jest.fn();
const mockInsertTransportGroup = jest.fn();
const mockUpdateTransportGroup = jest.fn();
const mockCheckDuplicateInvoice = jest.fn().mockResolvedValue(false);

jest.mock('../services/supabaseService', () => ({
  fetchAllBills: (...args) => mockFetchAllBills(...args),
  insertBill: (...args) => mockInsertBill(...args),
  updateBill: (...args) => mockUpdateBill(...args),
  deleteBill: (...args) => mockDeleteBill(...args),
  fetchTransportGroups: (...args) => mockFetchTransportGroups(...args),
  fetchAllPayments: (...args) => mockFetchAllPayments(...args),
  insertBillPayment: (...args) => mockInsertBillPayment(...args),
  insertTransportGroup: (...args) => mockInsertTransportGroup(...args),
  updateTransportGroup: (...args) => mockUpdateTransportGroup(...args),
  checkDuplicateInvoice: (...args) => mockCheckDuplicateInvoice(...args),
}));

// Mock AuditContext
jest.mock('../contexts/AuditContext', () => ({
  useAudit: () => ({ logAction: jest.fn() }),
}));

const createAuthValue = (role = 'admin') => ({
  user: { username: role === 'admin' ? 'ramesh' : 'shreenth', role },
  hasRole: (roles) => {
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(role);
  },
  loading: false, error: null, isAuthenticated: true,
  login: jest.fn(), logout: jest.fn(),
  hasPermission: jest.fn(), hasModuleAccess: jest.fn(), refreshSession: jest.fn(),
});

const createWrapper = (authValue) => {
  return ({ children }) => (
    <AuthContext.Provider value={authValue}>
      <DataProvider>{children}</DataProvider>
    </AuthContext.Provider>
  );
};

describe('DataContext — Initial Load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
  });

  test('loads data from Supabase on mount', async () => {
    mockFetchAllBills.mockResolvedValue([
      { id: '1', module: 'transport', status: 'pending_approval', vendorName: 'ABC' },
      { id: '2', module: 'general', status: 'approved', vendorName: 'DEF' },
    ]);

    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(mockFetchAllBills).toHaveBeenCalled();
    expect(result.current.transportInvoices).toHaveLength(1);
    expect(result.current.generalBills).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  test('handles Supabase load error gracefully', async () => {
    mockFetchAllBills.mockRejectedValue(new Error('Network error'));

    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });
});

describe('DataContext — createEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAllBills.mockResolvedValue([]);
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
  });

  test('creates entry with correct default fields', async () => {
    mockInsertBill.mockResolvedValue({ id: 'NEW-1' });

    const wrapper = createWrapper(createAuthValue('accounts'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let newEntry;
    await act(async () => {
      newEntry = await result.current.createEntry('transport', {
        vendorName: 'Test Vendor',
        invoiceAmount: 5000,
      });
    });

    expect(newEntry).not.toBeNull();
    expect(newEntry.status).toBe(STATUS_VALUES.PENDING_APPROVAL);
    expect(newEntry.managerApproval).toBe('pending');
    expect(newEntry.paymentStatus).toBe('Pending');
    expect(newEntry.submittedBy).toBe('shreenth');
    expect(newEntry.submittedAt).toBeTruthy();
    expect(newEntry.id).toBeTruthy();
  });

  test('rollbacks on Supabase insert failure', async () => {
    mockInsertBill.mockRejectedValue(new Error('Insert failed'));

    const wrapper = createWrapper(createAuthValue('accounts'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let threw = false;
    await act(async () => {
      try {
        await result.current.createEntry('transport', {
          vendorName: 'Fail Vendor',
        });
      } catch (err) {
        threw = true;
      }
    });

    expect(threw).toBe(true);
    expect(result.current.transportInvoices).toHaveLength(0);
  });

  test('returns null for unknown module', async () => {
    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let entry;
    await act(async () => {
      entry = await result.current.createEntry('nonexistent', {});
    });

    expect(entry).toBeNull();
  });
});

describe('DataContext — approveEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
    mockFetchAllBills.mockResolvedValue([
      { id: 'BILL-1', module: 'transport', status: 'pending_approval', vendorName: 'ABC' },
    ]);
  });

  test('sets correct approval fields', async () => {
    mockUpdateBill.mockResolvedValue({ id: 'BILL-1', status: 'ready_for_upload' });

    const wrapper = createWrapper(createAuthValue('admin'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let success;
    await act(async () => {
      success = await result.current.approveEntry('transport', 'BILL-1', 'Looks good');
    });

    expect(success).toBe(true);

    // Verify the update payload sent to Supabase
    const updateCall = mockUpdateBill.mock.calls[0];
    expect(updateCall[0]).toBe('BILL-1');
    const updates = updateCall[1];
    expect(updates.status).toBe('ready_for_upload');
    expect(updates.approvedBy).toBe('ramesh');
    expect(updates.managerApproval).toBe('approved');
    expect(updates.managerApprovedBy).toBe('ramesh');
    expect(updates.notes).toBe('Looks good');
  });

  test('rolls back on Supabase failure', async () => {
    mockUpdateBill.mockRejectedValue(new Error('Update failed'));

    const wrapper = createWrapper(createAuthValue('admin'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let success;
    await act(async () => {
      success = await result.current.approveEntry('transport', 'BILL-1');
    });

    expect(success).toBe(false);
    // Entry should still be pending after rollback
    expect(result.current.transportInvoices[0].status).toBe('pending_approval');
  });
});

describe('DataContext — rejectEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
    mockFetchAllBills.mockResolvedValue([
      { id: 'BILL-2', module: 'transport', status: 'pending_approval', vendorName: 'DEF' },
    ]);
  });

  test('sets correct rejection fields', async () => {
    mockUpdateBill.mockResolvedValue({ id: 'BILL-2', status: 'rejected' });

    const wrapper = createWrapper(createAuthValue('admin'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await act(async () => {
      await result.current.rejectEntry('transport', 'BILL-2', 'Duplicate invoice');
    });

    const updates = mockUpdateBill.mock.calls[0][1];
    expect(updates.status).toBe('rejected');
    expect(updates.notes).toBe('Duplicate invoice');
    expect(updates.managerApproval).toBe('rejected');
    expect(updates.managerApprovedBy).toBe('ramesh');
  });
});

describe('DataContext — markAsPaid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
    mockFetchAllBills.mockResolvedValue([
      { id: 'BILL-3', module: 'transport', status: 'uploaded_to_bank', vendorName: 'GHI' },
    ]);
  });

  test('sets correct payment fields with IDFC Bank', async () => {
    mockUpdateBill.mockResolvedValue({ id: 'BILL-3', status: 'payment_done' });

    const wrapper = createWrapper(createAuthValue('accounts'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await act(async () => {
      await result.current.markAsPaid('transport', 'BILL-3', 'IDFC Bank');
    });

    const updates = mockUpdateBill.mock.calls[0][1];
    expect(updates.status).toBe('payment_done');
    expect(updates.paymentMode).toBe('IDFC Bank');
    expect(updates.paymentCompletedBy).toBe('shreenth');
    expect(updates.paymentCompletedDate).toBeTruthy();
  });

  test('sets correct payment fields with Cashfree', async () => {
    mockUpdateBill.mockResolvedValue({ id: 'BILL-3', status: 'payment_done' });

    const wrapper = createWrapper(createAuthValue('accounts'));
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await act(async () => {
      await result.current.markAsPaid('transport', 'BILL-3', 'Cashfree');
    });

    const updates = mockUpdateBill.mock.calls[0][1];
    expect(updates.paymentMode).toBe('Cashfree');
  });

  test('null user falls back to system', async () => {
    mockUpdateBill.mockResolvedValue({ id: 'BILL-3', status: 'payment_done' });

    // Create auth with null user
    const authValue = {
      ...createAuthValue('accounts'),
      user: null,
    };
    const wrapper = createWrapper(authValue);
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    await act(async () => {
      await result.current.markAsPaid('transport', 'BILL-3', 'Bank');
    });

    const updates = mockUpdateBill.mock.calls[0][1];
    expect(updates.paymentCompletedBy).toBe('system');
  });
});

describe('DataContext — deleteEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
    mockFetchAllBills.mockResolvedValue([
      { id: 'BILL-4', module: 'transport', status: 'pending_approval', vendorName: 'Test' },
    ]);
  });

  test('deletes entry and returns true', async () => {
    mockDeleteBill.mockResolvedValue(true);

    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let success;
    await act(async () => {
      success = await result.current.deleteEntry('transport', 'BILL-4');
    });

    expect(success).toBe(true);
    expect(result.current.transportInvoices).toHaveLength(0);
  });

  test('rolls back on delete failure', async () => {
    mockDeleteBill.mockRejectedValue(new Error('Delete failed'));

    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let success;
    await act(async () => {
      success = await result.current.deleteEntry('transport', 'BILL-4');
    });

    expect(success).toBe(false);
    expect(result.current.transportInvoices).toHaveLength(1);
  });

  test('returns false for non-existent entry', async () => {
    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    let success;
    await act(async () => {
      success = await result.current.deleteEntry('transport', 'NONEXISTENT');
    });

    expect(success).toBe(false);
  });
});

describe('DataContext — getAllEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTransportGroups.mockResolvedValue([]);
    mockFetchAllPayments.mockResolvedValue([]);
    mockFetchAllBills.mockResolvedValue([
      { id: '1', module: 'transport', status: 'pending_approval' },
      { id: '2', module: 'general', status: 'approved' },
      { id: '3', module: 'packing', status: 'closed' },
    ]);
  });

  test('returns all entries with module field', async () => {
    const wrapper = createWrapper(createAuthValue());
    const { result } = renderHook(() => useData(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const allEntries = result.current.getAllEntries();
    expect(allEntries).toHaveLength(3);
    expect(allEntries[0].module).toBe('transport');
    expect(allEntries[1].module).toBe('general');
    expect(allEntries[2].module).toBe('packing');
  });
});
