/**
 * Seed script: reads JSON data files and batch-inserts into Supabase bills table.
 *
 * Usage:
 *   1. Run the SQL schema in Supabase SQL Editor first
 *   2. npm run seed
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ---- Config ----
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://sbomiqwvzxiwofgwthcr.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNib21pcXd2enhpd29mZ3d0aGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTkyMTgsImV4cCI6MjA4NjI5NTIxOH0.BOFxMdh8zLxQChcIZiIwzLBk69uJl4bNPpdI8o6HWkA';
const BATCH_SIZE = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- camelCase -> snake_case mapping ----
const CAMEL_TO_SNAKE = {
  managerApproval: 'manager_approval',
  accountsApproval: 'accounts_approval',
  submittedBy: 'submitted_by',
  submittedAt: 'submitted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  managerApprovedBy: 'manager_approved_by',
  managerApprovalDate: 'manager_approval_date',
  accountsApprovedBy: 'accounts_approved_by',
  accountsApprovalDate: 'accounts_approval_date',
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
  approvedBy: 'approved_by',
  submissionStatus: 'submission_status',
  customerId: 'customer_id',
  customerName: 'customer_name',
  refundAmount: 'refund_amount',
  refundStatus: 'refund_status',
  driverName: 'driver_name',
  paymentMode: 'payment_mode',
  reviewerName: 'reviewer_name',
};

function toSnake(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = CAMEL_TO_SNAKE[key] || key;
    out[snakeKey] = value;
  }
  return out;
}

// ---- Module definitions ----
const MODULES = [
  { module: 'transport', file: 'transportInvoices.json' },
  { module: 'general', file: 'generalBills.json' },
  { module: 'packing', file: 'packingMaterials.json' },
  { module: 'petty', file: 'pettyCash.json' },
  { module: 'happy', file: 'happyCard.json' },
  { module: 'refunds', file: 'refunds.json' },
  { module: 'drive', file: 'driveTrackPorter.json' },
  { module: 'reviews', file: 'reviews.json' },
];

async function seed() {
  console.log('Starting Supabase seed...\n');

  // Clear existing data
  console.log('Clearing existing bills...');
  const { error: delError } = await supabase.from('bills').delete().neq('id', '');
  if (delError) {
    console.error('Failed to clear bills table:', delError.message);
    process.exit(1);
  }
  console.log('Bills table cleared.\n');

  let totalInserted = 0;

  for (const { module, file } of MODULES) {
    const filePath = path.join(__dirname, '..', 'src', 'data', file);

    if (!fs.existsSync(filePath)) {
      console.warn(`  SKIP: ${file} not found`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const records = Array.isArray(raw) ? raw : [];

    console.log(`  ${module}: ${records.length} records`);

    // Numeric columns that must not contain empty strings
    const NUMERIC_COLS = [
      'payable_amount', 'amount', 'invoice_amount', 'received_amount',
      'packing_material', 'profit_loss', 'refund_amount', 'distance', 'rating',
    ];

    // Convert to snake_case and add module column
    const rows = records.map((record) => {
      const row = toSnake(record);
      row.module = module;
      // Sanitize empty strings in numeric columns to null
      for (const col of NUMERIC_COLS) {
        if (row[col] === '' || row[col] === ' ') {
          row[col] = null;
        }
      }
      return row;
    });

    // Batch insert
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('bills').insert(batch);

      if (error) {
        console.error(`  ERROR inserting ${module} batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        // Continue with next batch
      } else {
        totalInserted += batch.length;
      }
    }
  }

  console.log(`\nDone! Inserted ${totalInserted} total records.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
