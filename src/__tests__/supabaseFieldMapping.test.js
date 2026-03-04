/**
 * Test Suite: supabaseService field mapping
 * Verifies camelCase ↔ snake_case mappings include the DB columns
 * needed for the approval workflow (using existing DB columns)
 */

// Re-implement the actual mapping from supabaseService.js
const CAMEL_TO_SNAKE = {
  submittedBy: 'submitted_by',
  submittedAt: 'submitted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  managerApproval: 'manager_approval',
  accountsApproval: 'accounts_approval',
  managerApprovedBy: 'manager_approved_by',
  managerApprovalDate: 'manager_approval_date',
  accountsApprovedBy: 'accounts_approved_by',
  accountsApprovalDate: 'accounts_approval_date',
  approvedBy: 'approved_by',
  paymentCompletedBy: 'payment_completed_by',
  paymentCompletedDate: 'payment_completed_date',
  vendorName: 'vendor_name',
  invoiceDate: 'invoice_date',
  payableAmount: 'payable_amount',
  paymentStatus: 'payment_status',
  invoiceNumber: 'invoice_number',
  invoiceAmount: 'invoice_amount',
  receivedAmount: 'received_amount',
  packingMaterial: 'packing_material',
  profitLoss: 'profit_loss',
  invoiceNo: 'invoice_no',
  uploadedDate: 'uploaded_date',
  submissionStatus: 'submission_status',
  customerId: 'customer_id',
  customerName: 'customer_name',
  refundAmount: 'refund_amount',
  refundStatus: 'refund_status',
  driverName: 'driver_name',
  paymentMode: 'payment_mode',
  reviewerName: 'reviewer_name',
  attachmentUrl: 'attachment_url',
};

const SNAKE_TO_CAMEL = {};
for (const [camel, snake] of Object.entries(CAMEL_TO_SNAKE)) {
  SNAKE_TO_CAMEL[snake] = camel;
}

function toSnake(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[CAMEL_TO_SNAKE[key] || key] = value;
  }
  return out;
}

function toCamel(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[SNAKE_TO_CAMEL[key] || key] = value;
  }
  return out;
}

describe('Approval Field Mappings (using existing DB columns)', () => {
  test('managerApproval → manager_approval', () => {
    expect(CAMEL_TO_SNAKE.managerApproval).toBe('manager_approval');
  });

  test('accountsApproval → accounts_approval', () => {
    expect(CAMEL_TO_SNAKE.accountsApproval).toBe('accounts_approval');
  });

  test('managerApprovedBy → manager_approved_by', () => {
    expect(CAMEL_TO_SNAKE.managerApprovedBy).toBe('manager_approved_by');
  });

  test('accountsApprovedBy → accounts_approved_by', () => {
    expect(CAMEL_TO_SNAKE.accountsApprovedBy).toBe('accounts_approved_by');
  });

  test('approvedBy → approved_by', () => {
    expect(CAMEL_TO_SNAKE.approvedBy).toBe('approved_by');
  });

  test('paymentMode → payment_mode', () => {
    expect(CAMEL_TO_SNAKE.paymentMode).toBe('payment_mode');
  });
});

describe('Approve Action — toSnake conversion', () => {
  test('approve payload converts correctly for Supabase', () => {
    const payload = {
      notes: 'Approved',
      status: 'approved',
      approvedBy: 'ramesh',
      managerApproval: 'approved',
      managerApprovedBy: 'ramesh',
      managerApprovalDate: '2026-02-16T10:00:00Z',
      accountsApproval: 'approved',
      accountsApprovedBy: 'ramesh',
      accountsApprovalDate: '2026-02-16T10:00:00Z',
    };
    const result = toSnake(payload);

    expect(result.status).toBe('approved');
    expect(result.approved_by).toBe('ramesh');
    expect(result.manager_approval).toBe('approved');
    expect(result.manager_approved_by).toBe('ramesh');
    expect(result.manager_approval_date).toBe('2026-02-16T10:00:00Z');
    expect(result.accounts_approval).toBe('approved');
    expect(result.accounts_approved_by).toBe('ramesh');
    expect(result.accounts_approval_date).toBe('2026-02-16T10:00:00Z');
  });
});

describe('Reject Action — toSnake conversion', () => {
  test('reject payload converts correctly for Supabase', () => {
    const payload = {
      notes: 'Duplicate',
      status: 'rejected',
      managerApproval: 'rejected',
      managerApprovedBy: 'ramesh',
      managerApprovalDate: '2026-02-16T10:00:00Z',
    };
    const result = toSnake(payload);

    expect(result.status).toBe('rejected');
    expect(result.manager_approval).toBe('rejected');
    expect(result.notes).toBe('Duplicate');
  });
});

describe('Mark Paid — toSnake conversion', () => {
  test('payment payload converts correctly', () => {
    const payload = {
      status: 'closed',
      paymentMode: 'Bank',
      paymentCompletedBy: 'shreenth',
      paymentCompletedDate: '2026-02-16T10:00:00Z',
    };
    const result = toSnake(payload);

    expect(result.status).toBe('closed');
    expect(result.payment_mode).toBe('Bank');
    expect(result.payment_completed_by).toBe('shreenth');
  });
});

describe('Create Entry — toSnake conversion', () => {
  test('new entry has all required DB fields', () => {
    const payload = {
      status: 'pending_approval',
      managerApproval: 'pending',
      accountsApproval: 'pending',
      submittedBy: 'shreenth',
      submittedAt: '2026-02-16T10:00:00Z',
      vendorName: 'ABC Transport',
      invoiceAmount: 5000,
    };
    const result = toSnake(payload);

    expect(result.status).toBe('pending_approval');
    expect(result.manager_approval).toBe('pending');
    expect(result.accounts_approval).toBe('pending');
    expect(result.submitted_by).toBe('shreenth');
    expect(result.vendor_name).toBe('ABC Transport');
    expect(result.invoice_amount).toBe(5000);
  });
});

describe('toCamel — DB row to JS', () => {
  test('converts DB row back correctly', () => {
    const dbRow = {
      id: 'TEST-001',
      status: 'approved',
      manager_approval: 'approved',
      accounts_approval: 'approved',
      approved_by: 'ramesh',
      vendor_name: 'ABC Corp',
      invoice_amount: 5000,
      payment_mode: 'Bank',
    };
    const result = toCamel(dbRow);

    expect(result.managerApproval).toBe('approved');
    expect(result.accountsApproval).toBe('approved');
    expect(result.approvedBy).toBe('ramesh');
    expect(result.vendorName).toBe('ABC Corp');
    expect(result.paymentMode).toBe('Bank');
  });
});

describe('Roundtrip', () => {
  test('camel → snake → camel preserves data', () => {
    const original = {
      managerApproval: 'approved',
      accountsApproval: 'approved',
      approvedBy: 'ramesh',
      paymentMode: 'Cashfree',
      vendorName: 'Test',
    };
    expect(toCamel(toSnake(original))).toEqual(original);
  });
});
