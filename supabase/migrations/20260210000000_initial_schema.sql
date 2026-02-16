-- ============================================================
-- SafeStorage Accounts App — Supabase Schema
-- Single "bills" table for all 8 modules + audit_logs
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Bills table (all modules)
CREATE TABLE IF NOT EXISTS bills (
  -- Primary key (keeps existing seed IDs like "TRN-001")
  id TEXT PRIMARY KEY,

  -- Module discriminator
  module TEXT NOT NULL CHECK (module IN (
    'transport', 'general', 'packing', 'petty',
    'happy', 'refunds', 'drive', 'reviews'
  )),

  -- ---- Common workflow fields ----
  status TEXT DEFAULT 'pending',
  manager_approval TEXT DEFAULT 'pending',
  accounts_approval TEXT DEFAULT 'pending',
  submitted_by TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Approval details
  manager_approved_by TEXT,
  manager_approval_date TIMESTAMPTZ,
  accounts_approved_by TEXT,
  accounts_approval_date TIMESTAMPTZ,

  -- Payment completion
  payment_completed_by TEXT,
  payment_completed_date TIMESTAMPTZ,

  -- Notes (approval notes)
  notes TEXT,

  -- ---- Shared fields (used by multiple modules) ----
  vendor_name TEXT,
  invoice_date TEXT,        -- stored as string from Excel
  month TEXT,
  payable_amount NUMERIC,
  payment_status TEXT,
  city TEXT,
  remarks TEXT,
  date TEXT,                -- stored as string from Excel
  amount NUMERIC,
  description TEXT,

  -- ---- Transport-specific ----
  invoice_number TEXT,      -- transport: invoiceNumber
  invoice_amount NUMERIC,   -- transport: invoiceAmount
  received_amount NUMERIC,  -- transport: receivedAmount
  packing_material NUMERIC, -- transport: packingMaterial cost
  profit_loss NUMERIC,      -- transport: calculated P/L

  -- ---- General / Packing shared ----
  invoice_no TEXT,          -- general/packing: invoiceNo
  uploaded_date TEXT,       -- general: uploadedDate
  approved_by TEXT,         -- general: approvedBy
  submission_status TEXT,   -- packing: submissionStatus

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
  payment_mode TEXT,

  -- ---- Reviews ----
  rating NUMERIC,
  reviewer_name TEXT
);

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bills_module ON bills (module);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills (status);
CREATE INDEX IF NOT EXISTS idx_bills_manager_approval ON bills (manager_approval);
CREATE INDEX IF NOT EXISTS idx_bills_accounts_approval ON bills (accounts_approval);
CREATE INDEX IF NOT EXISTS idx_bills_module_status ON bills (module, status);

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

-- 4. Disable RLS (auth is client-side demo)
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON bills FOR ALL USING (true) WITH CHECK (true);

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

-- RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
