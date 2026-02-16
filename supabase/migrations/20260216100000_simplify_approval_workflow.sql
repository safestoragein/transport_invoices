-- Migration: Simplify approval workflow from 2-level to single-level
-- Old flow: pending → awaiting_manager_approval → awaiting_accounts_approval → awaiting_payment → closed
-- New flow: pending_approval → approved → closed (or rejected)

-- Add new approval columns
ALTER TABLE bills ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS rejected_by TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS rejection_date TIMESTAMPTZ;

-- Migrate existing data: map old statuses to new statuses
UPDATE bills SET status = 'pending_approval' WHERE status IN ('pending', 'awaiting_manager_approval', 'awaiting_accounts_approval');
UPDATE bills SET status = 'approved' WHERE status = 'awaiting_payment';
-- 'approved', 'rejected', 'closed' stay as-is

-- Copy existing approval data to new columns where applicable
UPDATE bills SET approval_date = COALESCE(accounts_approval_date, manager_approval_date)
  WHERE approved_by IS NOT NULL OR accounts_approved_by IS NOT NULL OR manager_approved_by IS NOT NULL;
UPDATE bills SET approved_by = COALESCE(accounts_approved_by, manager_approved_by)
  WHERE approved_by IS NULL AND (accounts_approved_by IS NOT NULL OR manager_approved_by IS NOT NULL);

-- Update indexes for new status values
DROP INDEX IF EXISTS idx_bills_manager_approval;
DROP INDEX IF EXISTS idx_bills_accounts_approval;
