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
  // Approval fields (new simplified flow)
  approvedBy: 'approved_by',
  approvalDate: 'approval_date',
  rejectedBy: 'rejected_by',
  rejectionDate: 'rejection_date',
  // Payment
  paymentCompletedBy: 'payment_completed_by',
  paymentCompletedDate: 'payment_completed_date',
  // Shared
  vendorName: 'vendor_name',
  invoiceDate: 'invoice_date',
  payableAmount: 'payable_amount',
  paymentStatus: 'payment_status',
  // Transport
  invoiceNumber: 'invoice_number',
  invoiceAmount: 'invoice_amount',
  receivedAmount: 'received_amount',
  packingMaterial: 'packing_material',
  profitLoss: 'profit_loss',
  // General / Packing
  invoiceNo: 'invoice_no',
  uploadedDate: 'uploaded_date',
  approvedBy: 'approved_by',
  submissionStatus: 'submission_status',
  // Refunds
  customerId: 'customer_id',
  customerName: 'customer_name',
  refundAmount: 'refund_amount',
  refundStatus: 'refund_status',
  // Drive
  driverName: 'driver_name',
  paymentMode: 'payment_mode',
  // Reviews
  reviewerName: 'reviewer_name',
  // Attachments
  attachmentUrl: 'attachment_url',
};

// Build reverse map
const SNAKE_TO_CAMEL = {};
for (const [camel, snake] of Object.entries(CAMEL_TO_SNAKE)) {
  SNAKE_TO_CAMEL[snake] = camel;
}

/**
 * Convert a JS object (camelCase keys) to Postgres row (snake_case keys).
 * Keys not in the map are passed through unchanged.
 */
function toSnake(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = CAMEL_TO_SNAKE[key] || key;
    out[snakeKey] = value;
  }
  return out;
}

/**
 * Convert a Postgres row (snake_case keys) to JS object (camelCase keys).
 * Keys not in the map are passed through unchanged.
 */
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

/**
 * Fetch all bills (all modules).
 * Paginates in chunks of 1000 to bypass Supabase default row limit.
 * Returns camelCase JS objects.
 */
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

/**
 * Fetch bills for a single module.
 * Paginates to handle modules with >1000 records.
 */
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

/**
 * Insert a single bill. `data` should be camelCase and must include `id`.
 * The `module` column is set from the parameter.
 */
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

/**
 * Update a bill by id. `updates` is camelCase.
 */
export async function updateBill(id, updates) {
  const row = toSnake(updates);
  // Don't send id or module in the update payload
  delete row.id;
  delete row.module;

  const { data, error } = await supabase
    .from('bills')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCamel(data);
}

/**
 * Delete a bill by id.
 */
export async function deleteBill(id) {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Get a single bill by id.
 */
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

// ============================================================
// Audit Logs
// ============================================================

/**
 * Insert an audit log entry. `entry` is camelCase.
 */
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

/**
 * Fetch audit logs with optional filters.
 * Returns rows sorted by timestamp DESC.
 */
export async function fetchAuditLogs(options = {}) {
  const { limit = 1000, module, action, userId } = options;

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (module) query = query.eq('module', module);
  if (action) query = query.eq('action', action);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;

  // Map back to camelCase for consumers
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
