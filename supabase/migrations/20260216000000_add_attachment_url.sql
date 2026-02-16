-- Add attachment_url column to bills table for invoice file attachments
ALTER TABLE bills ADD COLUMN IF NOT EXISTS attachment_url TEXT;
