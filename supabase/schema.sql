-- ============================================================
-- SafeStorage Accounts App — Supabase Schema v3.0
-- Unified bills table + transport_groups + bill_payments + audit_logs
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Bills table (all modules)
CREATE TABLE IF NOT EXISTS bills (
  -- Primary key
  id TEXT PRIMARY KEY,

  -- Module discriminator
  module TEXT NOT NULL CHECK (module IN (
    'transport', 'general', 'packing', 'petty',
    'happy', 'refunds', 'drive', 'reviews'
  )),

  -- Bill type (spec-aligned alias for module)
  bill_type TEXT GENERATED ALWAYS AS (
    CASE module
      WHEN 'transport' THEN 'TRANSPORT'
      WHEN 'general' THEN 'GENERAL'
      WHEN 'packing' THEN 'PACKING'
      WHEN 'petty' THEN 'PETTY_CASH'
      ELSE UPPER(module)
    END
  ) STORED,

  -- ---- Common workflow fields ----
  status TEXT DEFAULT 'pending_approval',
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Vendor fields
  vendor_name TEXT,
  vendor_note TEXT,            -- route / advance / comments

  -- Invoice identification
  invoice_number TEXT,         -- transport: invoiceNumber (unique enforced below)
  invoice_no TEXT,             -- general/packing: invoiceNo
  invoice_date TEXT,           -- stored as string from Excel
  month TEXT,                  -- explicit month field

  -- Amounts
  payable_amount NUMERIC,
  amount NUMERIC,

  -- Payment routing
  payment_mode TEXT,           -- 'IDFC Bank' or 'Cashfree'
  payment_status TEXT,

  -- ---- 4-stage approval workflow ----
  -- Stage 1: PENDING_APPROVAL -> READY_FOR_UPLOAD (approval)
  approved_by TEXT,
  approval_date TIMESTAMPTZ,
  approval_timestamp TIMESTAMPTZ,  -- spec-aligned alias
  rejected_by TEXT,
  rejection_date TIMESTAMPTZ,

  -- Stage 2: READY_FOR_UPLOAD -> UPLOADED_TO_BANK
  uploaded_by TEXT,
  uploaded_timestamp TIMESTAMPTZ,
  uploaded_for_payment_by TEXT,
  uploaded_for_payment_date TIMESTAMPTZ,

  -- Stage 3: UPLOADED_TO_BANK -> PAYMENT_DONE
  payment_date TIMESTAMPTZ,
  payment_completed_by TEXT,
  payment_completed_date TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- ---- Shared fields ----
  city TEXT,
  remarks TEXT,
  date TEXT,
  description TEXT,
  due_date TEXT,

  -- ---- Transport-specific ----
  invoice_amount NUMERIC,
  received_amount NUMERIC,       -- received_from_customer
  packing_material NUMERIC,
  profit_loss NUMERIC,

  -- Transport: TDS fields
  tds_applicable BOOLEAN DEFAULT false,
  tds_percentage NUMERIC DEFAULT 0,
  tds_amount NUMERIC DEFAULT 0,
  net_payable NUMERIC DEFAULT 0,

  -- Transport: Penalty & Final Payable
  penalty_amount NUMERIC DEFAULT 0,
  final_payable NUMERIC DEFAULT 0,

  -- Transport: Grouping
  weekly_group_id TEXT,
  bank_upload_batch_id TEXT,

  -- Transport: Multi-invoice line items
  invoices JSONB DEFAULT NULL,

  -- ---- General / Packing shared ----
  uploaded_date TEXT,
  submission_status TEXT,

  -- ---- Petty Cash ----
  category TEXT,
  particulars TEXT,

  -- ---- Refunds ----
  customer_id TEXT,
  customer_name TEXT,
  refund_amount NUMERIC,
  reason TEXT,
  refund_status TEXT,

  -- ---- Drive Track / Porter ----
  driver_name TEXT,
  distance NUMERIC,
  driver_payment_mode TEXT,

  -- ---- Reviews ----
  rating NUMERIC,
  reviewer_name TEXT,

  -- ---- Attachments ----
  attachment_url TEXT,

  -- ---- Legacy compat ----
  manager_approval TEXT,
  manager_approved_by TEXT,
  manager_approval_date TIMESTAMPTZ,
  accounts_approval TEXT,
  accounts_approved_by TEXT,
  accounts_approval_date TIMESTAMPTZ,
  bank_status TEXT,
  materials TEXT,
  approved_date TEXT,
  profit_loss_type TEXT
);

-- Unique invoice number constraint (per module, only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_invoice_number_unique
  ON bills (invoice_number) WHERE invoice_number IS NOT NULL AND invoice_number != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_invoice_no_unique
  ON bills (invoice_no) WHERE invoice_no IS NOT NULL AND invoice_no != '';

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bills_module ON bills (module);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills (status);
CREATE INDEX IF NOT EXISTS idx_bills_payment_mode ON bills (payment_mode);
CREATE INDEX IF NOT EXISTS idx_bills_module_status ON bills (module, status);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_name ON bills (vendor_name);
CREATE INDEX IF NOT EXISTS idx_bills_weekly_group ON bills (weekly_group_id) WHERE weekly_group_id IS NOT NULL;

-- 3. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bills_updated_at ON bills;
CREATE TRIGGER bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. RLS for bills
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON bills FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Transport Groups table
-- ============================================================
CREATE TABLE IF NOT EXISTS transport_groups (
  group_id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  week_start DATE,
  week_end DATE,
  total_received NUMERIC DEFAULT 0,
  total_packing_material NUMERIC DEFAULT 0,
  total_invoice_amount NUMERIC DEFAULT 0,
  total_tds NUMERIC DEFAULT 0,
  total_penalty NUMERIC DEFAULT 0,
  total_final_payable NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_groups_vendor ON transport_groups (vendor_name);

ALTER TABLE transport_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON transport_groups FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS transport_groups_updated_at ON transport_groups;
CREATE TRIGGER transport_groups_updated_at
  BEFORE UPDATE ON transport_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Bill Payments table (multiple payments per bill)
-- ============================================================
CREATE TABLE IF NOT EXISTS bill_payments (
  payment_id TEXT PRIMARY KEY,
  bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  payment_amount NUMERIC NOT NULL CHECK (payment_amount > 0),
  payment_date TIMESTAMPTZ DEFAULT now(),
  payment_reference TEXT,
  payment_mode TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments (bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_date ON bill_payments (payment_date DESC);

ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON bill_payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Audit Logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  module TEXT,
  record_id TEXT,
  user_id TEXT,
  username TEXT,
  previous_value JSONB,
  new_value JSONB,
  changes JSONB,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
