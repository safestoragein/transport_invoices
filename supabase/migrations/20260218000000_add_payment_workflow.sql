-- ============================================================
-- Payment Mode Routing Workflow Migration
-- Adds: due_date, driver_payment_mode, uploaded_for_payment fields
-- Renames: Bank -> IDFC Bank, closed -> payment_done
-- ============================================================

-- 1. Add new columns
ALTER TABLE bills ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS driver_payment_mode TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS uploaded_for_payment_by TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS uploaded_for_payment_date TIMESTAMPTZ;

-- 2. Migrate Drive module: copy payment_mode to driver_payment_mode
UPDATE bills
SET driver_payment_mode = payment_mode
WHERE module = 'drive' AND payment_mode IS NOT NULL;

-- 3. Rename existing 'Bank' payment_mode values to 'IDFC Bank'
UPDATE bills
SET payment_mode = 'IDFC Bank'
WHERE payment_mode = 'Bank';

-- 4. Migrate status 'closed' to 'payment_done'
UPDATE bills
SET status = 'payment_done'
WHERE status = 'closed';

-- 5. Add index on payment_mode for routing queries
CREATE INDEX IF NOT EXISTS idx_bills_payment_mode ON bills (payment_mode);

-- 6. Add profit_loss_type column if missing (used by transport)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS profit_loss_type TEXT;

-- 7. Add manager approval columns if missing
ALTER TABLE bills ADD COLUMN IF NOT EXISTS manager_approval TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS manager_approved_by TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS manager_approval_date TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS accounts_approval TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS accounts_approved_by TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS accounts_approval_date TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS approved_date TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS bank_status TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS materials TEXT;
