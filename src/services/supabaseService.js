import { supabase } from './supabaseClient';

// ============================================================
// Field mapping: camelCase (JS) <-> snake_case (Postgres)
// ============================================================

const CAMEL_TO_SNAKE = {
  // Workflow
  submittedBy: 'submitted_by',
  submittedAt: 'submitted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // Approval fields
  managerApproval: 'manager_approval',
  accountsApproval: 'accounts_approval',
  managerApprovedBy: 'manager_approved_by',
  managerApprovalDate: 'manager_approval_date',
  accountsApprovedBy: 'accounts_approved_by',
  accountsApprovalDate: 'accounts_approval_date',
  approvedBy: 'approved_by',
  approvalDate: 'approval_date',
  approvalTimestamp: 'approval_timestamp',
  rejectedBy: 'rejected_by',
  rejectionDate: 'rejection_date',
  // Payment
  paymentCompletedBy: 'payment_completed_by',
  paymentCompletedDate: 'payment_completed_date',
  paymentDate: 'payment_date',
  // Shared
  vendorName: 'vendor_name',
  vendorNote: 'vendor_note',
  invoiceDate: 'invoice_date',
  payableAmount: 'payable_amount',
  paymentStatus: 'payment_status',
  // Transport
  invoiceNumber: 'invoice_number',
  invoiceAmount: 'invoice_amount',
  receivedAmount: 'received_amount',
  packingMaterial: 'packing_material',
  profitLoss: 'profit_loss',
  profitLossType: 'profit_loss_type',
  // TDS & Penalty
  tdsApplicable: 'tds_applicable',
  tdsPercentage: 'tds_percentage',
  tdsAmount: 'tds_amount',
  netPayable: 'net_payable',
  penaltyAmount: 'penalty_amount',
  finalPayable: 'final_payable',
  // Grouping
  weeklyGroupId: 'weekly_group_id',
  bankUploadBatchId: 'bank_upload_batch_id',
  // General / Packing
  invoiceNo: 'invoice_no',
  uploadedDate: 'uploaded_date',
  submissionStatus: 'submission_status',
  materials: 'materials',
  bankStatus: 'bank_status',
  approvedDate: 'approved_date',
  // Refunds
  customerId: 'customer_id',
  customerName: 'customer_name',
  refundAmount: 'refund_amount',
  refundStatus: 'refund_status',
  // Drive
  driverName: 'driver_name',
  paymentMode: 'payment_mode',
  driverPaymentMode: 'driver_payment_mode',
  // Payment workflow
  dueDate: 'due_date',
  uploadedBy: 'uploaded_by',
  uploadedTimestamp: 'uploaded_timestamp',
  uploadedForPaymentBy: 'uploaded_for_payment_by',
  uploadedForPaymentDate: 'uploaded_for_payment_date',
  // Reviews
  reviewerName: 'reviewer_name',
  // Attachments
  attachmentUrl: 'attachment_url',
  // Bill type
  billType: 'bill_type',
};

// Build reverse map
const SNAKE_TO_CAMEL = {};
for (const [camel, snake] of Object.entries(CAMEL_TO_SNAKE)) {
  SNAKE_TO_CAMEL[snake] = camel;
}

function toSnake(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = CAMEL_TO_SNAKE[key] || key;
    out[snakeKey] = value;
  }
  return out;
}

function toCamel(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = SNAKE_TO_CAMEL[key] || key;
    out[camelKey] = value;
  }
  return out;
}

// ============================================================
// Bills CRUD
// ============================================================

export async function fetchAllBills() {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows.map(toCamel);
}

export async function fetchModuleData(module) {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('module', module)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows.map(toCamel);
}

export async function insertBill(module, data) {
  const row = toSnake(data);
  row.module = module;

  const { data: inserted, error } = await supabase
    .from('bills')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return toCamel(inserted);
}

export async function updateBill(id, updates) {
  const row = toSnake(updates);
  delete row.id;
  delete row.module;
  delete row.bill_type; // generated column, can't update

  const { data, error } = await supabase
    .from('bills')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamel(data);
}

export async function deleteBill(id) {
  const { error } = await supabase.from('bills').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getBill(id) {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', id)
    .limit(1)
    .single();

  if (error) throw error;
  return toCamel(data);
}

/**
 * Check if invoice number already exists
 */
export async function checkDuplicateInvoice(invoiceNumber, excludeId = null) {
  if (!invoiceNumber) return false;

  let query = supabase
    .from('bills')
    .select('id')
    .or(`invoice_number.eq.${invoiceNumber},invoice_no.eq.${invoiceNumber}`)
    .limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data && data.length > 0;
}

// ============================================================
// Transport Groups CRUD
// ============================================================

export async function fetchTransportGroups() {
  const { data, error } = await supabase
    .from('transport_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    groupId: row.group_id,
    groupName: row.group_name,
    vendorName: row.vendor_name,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    totalReceived: row.total_received,
    totalPackingMaterial: row.total_packing_material,
    totalInvoiceAmount: row.total_invoice_amount,
    totalTds: row.total_tds,
    totalPenalty: row.total_penalty,
    totalFinalPayable: row.total_final_payable,
    totalProfit: row.total_profit,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function insertTransportGroup(group) {
  const row = {
    group_id: group.groupId,
    group_name: group.groupName,
    vendor_name: group.vendorName,
    week_start: group.weekStart || null,
    week_end: group.weekEnd || null,
    total_received: group.totalReceived || 0,
    total_packing_material: group.totalPackingMaterial || 0,
    total_invoice_amount: group.totalInvoiceAmount || 0,
    total_tds: group.totalTds || 0,
    total_penalty: group.totalPenalty || 0,
    total_final_payable: group.totalFinalPayable || 0,
    total_profit: group.totalProfit || 0,
    created_by: group.createdBy,
  };

  const { data, error } = await supabase
    .from('transport_groups')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransportGroup(groupId, updates) {
  const row = {};
  if (updates.groupName !== undefined) row.group_name = updates.groupName;
  if (updates.totalReceived !== undefined) row.total_received = updates.totalReceived;
  if (updates.totalPackingMaterial !== undefined) row.total_packing_material = updates.totalPackingMaterial;
  if (updates.totalInvoiceAmount !== undefined) row.total_invoice_amount = updates.totalInvoiceAmount;
  if (updates.totalTds !== undefined) row.total_tds = updates.totalTds;
  if (updates.totalPenalty !== undefined) row.total_penalty = updates.totalPenalty;
  if (updates.totalFinalPayable !== undefined) row.total_final_payable = updates.totalFinalPayable;
  if (updates.totalProfit !== undefined) row.total_profit = updates.totalProfit;

  const { data, error } = await supabase
    .from('transport_groups')
    .update(row)
    .eq('group_id', groupId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransportGroup(groupId) {
  // First unlink any bills
  await supabase
    .from('bills')
    .update({ weekly_group_id: null })
    .eq('weekly_group_id', groupId);

  const { error } = await supabase
    .from('transport_groups')
    .delete()
    .eq('group_id', groupId);

  if (error) throw error;
  return true;
}

// ============================================================
// Bill Payments CRUD
// ============================================================

export async function fetchBillPayments(billId = null) {
  let query = supabase
    .from('bill_payments')
    .select('*')
    .order('payment_date', { ascending: false });

  if (billId) {
    query = query.eq('bill_id', billId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(row => ({
    paymentId: row.payment_id,
    billId: row.bill_id,
    paymentAmount: row.payment_amount,
    paymentDate: row.payment_date,
    paymentReference: row.payment_reference,
    paymentMode: row.payment_mode,
    createdBy: row.created_by,
    createdAt: row.created_at,
    notes: row.notes,
  }));
}

export async function fetchAllPayments() {
  const { data, error } = await supabase
    .from('bill_payments')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    paymentId: row.payment_id,
    billId: row.bill_id,
    paymentAmount: row.payment_amount,
    paymentDate: row.payment_date,
    paymentReference: row.payment_reference,
    paymentMode: row.payment_mode,
    createdBy: row.created_by,
    createdAt: row.created_at,
    notes: row.notes,
  }));
}

export async function insertBillPayment(payment) {
  const row = {
    payment_id: payment.paymentId,
    bill_id: payment.billId,
    payment_amount: payment.paymentAmount,
    payment_date: payment.paymentDate || new Date().toISOString(),
    payment_reference: payment.paymentReference || null,
    payment_mode: payment.paymentMode || null,
    created_by: payment.createdBy,
    notes: payment.notes || null,
  };

  const { data, error } = await supabase
    .from('bill_payments')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    paymentId: data.payment_id,
    billId: data.bill_id,
    paymentAmount: data.payment_amount,
    paymentDate: data.payment_date,
    paymentReference: data.payment_reference,
    paymentMode: data.payment_mode,
    createdBy: data.created_by,
    createdAt: data.created_at,
    notes: data.notes,
  };
}

export async function deleteBillPayment(paymentId) {
  const { error } = await supabase
    .from('bill_payments')
    .delete()
    .eq('payment_id', paymentId);

  if (error) throw error;
  return true;
}

// ============================================================
// Audit Logs
// ============================================================

export async function insertAuditLog(entry) {
  const row = {
    id: entry.id,
    action: entry.action,
    module: entry.module,
    record_id: entry.recordId,
    user_id: entry.userId,
    username: entry.username,
    previous_value: entry.previousValue || null,
    new_value: entry.newValue || null,
    changes: entry.changes || null,
    details: entry.details || null,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAuditLogs(options = {}) {
  const { limit = 1000, module, action, userId, recordId } = options;

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (module) query = query.eq('module', module);
  if (action) query = query.eq('action', action);
  if (userId) query = query.eq('user_id', userId);
  if (recordId) query = query.eq('record_id', recordId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    action: row.action,
    module: row.module,
    recordId: row.record_id,
    userId: row.user_id,
    username: row.username,
    previousValue: row.previous_value,
    newValue: row.new_value,
    changes: row.changes,
    details: row.details,
    timestamp: row.timestamp,
  }));
}
