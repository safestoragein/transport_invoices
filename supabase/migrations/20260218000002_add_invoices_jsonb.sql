-- Add JSONB column to store multiple invoice line items per transport entry.
-- Each element: { invoiceNumber, invoiceDate, invoiceAmount }
-- The existing invoice_amount column continues to hold the SUM for filtering/stats.
ALTER TABLE bills ADD COLUMN IF NOT EXISTS invoices JSONB DEFAULT NULL;
