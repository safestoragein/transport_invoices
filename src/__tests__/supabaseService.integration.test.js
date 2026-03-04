/**
 * Integration Test: supabaseService.js — direct imports
 * Tests the ACTUAL toSnake/toCamel functions and CRUD wrappers
 */

// Mock the supabase client before importing
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
}));

import * as service from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';

// ─── toSnake / toCamel via insertBill / fetchAllBills ───

describe('supabaseService — toSnake conversion (via insertBill)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupInsertMock = (returnData) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: returnData, error: null }),
    };
    const insertFn = jest.fn(() => chain);
    supabase.from.mockReturnValue({ insert: insertFn });
    return insertFn;
  };

  test('converts approve payload fields to snake_case', async () => {
    const insertFn = setupInsertMock({
      id: 'TEST-1',
      status: 'approved',
      manager_approval: 'approved',
      manager_approved_by: 'ramesh',
      accounts_approval: 'approved',
      approved_by: 'ramesh',
    });

    await service.insertBill('transport', {
      id: 'TEST-1',
      status: 'approved',
      managerApproval: 'approved',
      managerApprovedBy: 'ramesh',
      accountsApproval: 'approved',
      approvedBy: 'ramesh',
    });

    // Verify the row sent to Supabase has snake_case keys
    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.manager_approval).toBe('approved');
    expect(sentRow.manager_approved_by).toBe('ramesh');
    expect(sentRow.accounts_approval).toBe('approved');
    expect(sentRow.approved_by).toBe('ramesh');
    expect(sentRow.module).toBe('transport');
    // Should NOT have camelCase keys
    expect(sentRow.managerApproval).toBeUndefined();
    expect(sentRow.managerApprovedBy).toBeUndefined();
  });

  test('converts payment payload fields to snake_case', async () => {
    const insertFn = setupInsertMock({
      id: 'TEST-2',
      payment_mode: 'Bank',
      payment_completed_by: 'shreenth',
    });

    await service.insertBill('transport', {
      id: 'TEST-2',
      paymentMode: 'Bank',
      paymentCompletedBy: 'shreenth',
      paymentCompletedDate: '2026-02-16T10:00:00Z',
    });

    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.payment_mode).toBe('Bank');
    expect(sentRow.payment_completed_by).toBe('shreenth');
    expect(sentRow.payment_completed_date).toBe('2026-02-16T10:00:00Z');
  });

  test('converts transport invoice fields to snake_case', async () => {
    const insertFn = setupInsertMock({ id: 'TEST-3' });

    await service.insertBill('transport', {
      id: 'TEST-3',
      vendorName: 'ABC Transport',
      invoiceNumber: 'INV-001',
      invoiceAmount: 5000,
      receivedAmount: 6000,
      packingMaterial: 200,
      profitLoss: 800,
      invoiceDate: '2026-02-01',
      city: 'Bangalore', // single-word: passes through as-is
      remarks: 'Test', // single-word: passes through as-is
    });

    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.vendor_name).toBe('ABC Transport');
    expect(sentRow.invoice_number).toBe('INV-001');
    expect(sentRow.invoice_amount).toBe(5000);
    expect(sentRow.received_amount).toBe(6000);
    expect(sentRow.packing_material).toBe(200);
    expect(sentRow.profit_loss).toBe(800);
    expect(sentRow.invoice_date).toBe('2026-02-01');
    expect(sentRow.city).toBe('Bangalore'); // pass-through
    expect(sentRow.remarks).toBe('Test'); // pass-through
  });

  test('converts refund fields to snake_case', async () => {
    const insertFn = setupInsertMock({ id: 'TEST-4' });

    await service.insertBill('refunds', {
      id: 'TEST-4',
      customerId: 'CUST-1',
      customerName: 'John Doe',
      refundAmount: 1500,
      refundStatus: 'pending',
    });

    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.customer_id).toBe('CUST-1');
    expect(sentRow.customer_name).toBe('John Doe');
    expect(sentRow.refund_amount).toBe(1500);
    expect(sentRow.refund_status).toBe('pending');
  });

  test('converts drive/porter fields to snake_case', async () => {
    const insertFn = setupInsertMock({ id: 'TEST-5' });

    await service.insertBill('drive', {
      id: 'TEST-5',
      driverName: 'Raju',
      paymentMode: 'Cash',
    });

    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.driver_name).toBe('Raju');
    expect(sentRow.payment_mode).toBe('Cash');
  });

  test('single-word fields pass through unchanged', async () => {
    const insertFn = setupInsertMock({ id: 'TEST-6' });

    await service.insertBill('petty', {
      id: 'TEST-6',
      status: 'pending_approval',
      notes: 'Office supplies',
      amount: 500,
      category: 'Stationery',
      particulars: 'Pens and paper',
    });

    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.status).toBe('pending_approval');
    expect(sentRow.notes).toBe('Office supplies');
    expect(sentRow.amount).toBe(500);
    expect(sentRow.category).toBe('Stationery');
    expect(sentRow.particulars).toBe('Pens and paper');
  });
});

describe('supabaseService — toCamel conversion (via fetchAllBills)', () => {
  test('converts DB rows from snake_case to camelCase', async () => {
    const mockRows = [{
      id: 'ROW-1',
      status: 'approved',
      module: 'transport',
      vendor_name: 'ABC Corp',
      invoice_number: 'INV-001',
      invoice_amount: 5000,
      manager_approval: 'approved',
      manager_approved_by: 'ramesh',
      accounts_approval: 'approved',
      approved_by: 'ramesh',
      payment_mode: 'Bank',
      payment_completed_by: 'shreenth',
      submitted_by: 'shreenth',
      attachment_url: 'path/to/file.pdf',
    }];

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: mockRows, error: null }),
    });

    const result = await service.fetchAllBills();

    expect(result).toHaveLength(1);
    const row = result[0];
    expect(row.vendorName).toBe('ABC Corp');
    expect(row.invoiceNumber).toBe('INV-001');
    expect(row.invoiceAmount).toBe(5000);
    expect(row.managerApproval).toBe('approved');
    expect(row.managerApprovedBy).toBe('ramesh');
    expect(row.accountsApproval).toBe('approved');
    expect(row.approvedBy).toBe('ramesh');
    expect(row.paymentMode).toBe('Bank');
    expect(row.paymentCompletedBy).toBe('shreenth');
    expect(row.submittedBy).toBe('shreenth');
    expect(row.attachmentUrl).toBe('path/to/file.pdf');
    // Single-word fields pass through
    expect(row.status).toBe('approved');
    expect(row.module).toBe('transport');
    expect(row.id).toBe('ROW-1');
  });

  test('handles empty result set', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const result = await service.fetchAllBills();
    expect(result).toEqual([]);
  });

  test('throws on Supabase error', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    });

    await expect(service.fetchAllBills()).rejects.toEqual({ message: 'DB error' });
  });
});

describe('supabaseService — updateBill', () => {
  test('sends snake_case update and returns camelCase', async () => {
    const updateFn = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'X', status: 'approved', approved_by: 'ramesh' },
            error: null,
          }),
        }),
      }),
    });
    supabase.from.mockReturnValue({ update: updateFn });

    const result = await service.updateBill('X', {
      status: 'approved',
      approvedBy: 'ramesh',
      managerApproval: 'approved',
    });

    // Verify snake_case sent
    const sentRow = updateFn.mock.calls[0][0];
    expect(sentRow.approved_by).toBe('ramesh');
    expect(sentRow.manager_approval).toBe('approved');
    expect(sentRow.id).toBeUndefined(); // id stripped
    expect(sentRow.module).toBeUndefined(); // module stripped

    // Verify camelCase returned
    expect(result.approvedBy).toBe('ramesh');
  });
});

describe('supabaseService — deleteBill', () => {
  test('returns true on success', async () => {
    supabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    const result = await service.deleteBill('TEST-1');
    expect(result).toBe(true);
  });

  test('throws on error', async () => {
    supabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Not found' } }),
      }),
    });

    await expect(service.deleteBill('BAD')).rejects.toEqual({ message: 'Not found' });
  });
});

describe('supabaseService — insertAuditLog', () => {
  test('maps camelCase audit entry to snake_case row', async () => {
    const insertFn = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'AUD-1' },
          error: null,
        }),
      }),
    });
    supabase.from.mockReturnValue({ insert: insertFn });

    await service.insertAuditLog({
      id: 'AUD-1',
      action: 'approve',
      module: 'transport',
      recordId: 'BILL-1',
      userId: 'ramesh',
      username: 'Ramesh',
      previousValue: { status: 'pending' },
      newValue: { status: 'approved' },
      changes: [{ field: 'status', from: 'pending', to: 'approved' }],
      details: 'Admin approved',
    });

    const sentRow = insertFn.mock.calls[0][0];
    expect(sentRow.record_id).toBe('BILL-1');
    expect(sentRow.user_id).toBe('ramesh');
    expect(sentRow.previous_value).toEqual({ status: 'pending' });
    expect(sentRow.new_value).toEqual({ status: 'approved' });
    expect(sentRow.changes).toEqual([{ field: 'status', from: 'pending', to: 'approved' }]);
  });
});
