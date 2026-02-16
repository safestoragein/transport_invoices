/**
 * Import script: Delete existing bills and upload from Excel
 * Usage: node scripts/importExcel.js "/path/to/file.xlsx"
 */
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbomiqwvzxiwofgwthcr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNib21pcXd2enhpd29mZ3d0aGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTkyMTgsImV4cCI6MjA4NjI5NTIxOH0.BOFxMdh8zLxQChcIZiIwzLBk69uJl4bNPpdI8o6HWkA';
const supabase = createClient(supabaseUrl, supabaseKey);

// ---- Helpers ----

let idCounter = 0;
function genId(prefix) {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/** Convert Excel serial date to DD/MM/YYYY string */
function excelDateToStr(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    // Could be serial date (>40000) or DDMMYYYY integer (like 13062024)
    if (val > 10000000) {
      // DDMMYYYY format integer
      const s = val.toString();
      if (s.length === 8) {
        return `${s.slice(0,2)}/${s.slice(2,4)}/${s.slice(4)}`;
      }
    }
    // Excel serial date
    const date = new Date((val - 25569) * 86400 * 1000);
    const d = date.getUTCDate().toString().padStart(2, '0');
    const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(val).trim();
}

function cleanStr(val) {
  if (val === undefined || val === null || val === '') return '';
  return String(val).trim();
}

function cleanNum(val) {
  if (val === undefined || val === null || val === '') return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function defaultStatus() {
  return {
    status: 'pending',
    manager_approval: 'pending',
    accounts_approval: 'pending',
    submitted_by: 'excel-import',
    submitted_at: new Date().toISOString(),
  };
}

// ---- Sheet Parsers ----

function parseGeneral(rows) {
  return rows
    .filter(r => cleanStr(r['Vendor Name ']))
    .map(r => ({
      id: genId('GEN'),
      module: 'general',
      vendor_name: cleanStr(r['Vendor Name ']),
      invoice_no: cleanStr(r['Invoice No']),
      invoice_date: excelDateToStr(r['Invoice date ']),
      month: cleanStr(r['Month']),
      payable_amount: cleanNum(r['Payable amount ']),
      payment_status: cleanStr(r['`']) || null,
      uploaded_date: cleanStr(r['Upladed date']) || null,
      approved_by: cleanStr(r['Approved by']) || null,
      ...defaultStatus(),
    }));
}

function parsePacking(rows) {
  return rows
    .filter(r => cleanStr(r['Vendor Name ']))
    .map(r => ({
      id: genId('PKG'),
      module: 'packing',
      vendor_name: cleanStr(r['Vendor Name ']),
      invoice_no: cleanStr(r['__EMPTY']),
      invoice_date: excelDateToStr(r['Invoice date']),
      month: cleanStr(r['Month']),
      payable_amount: cleanNum(r['Payable amount']),
      submission_status: cleanStr(r['Submission Status']) || null,
      city: cleanStr(r['City']) || null,
      payment_status: cleanStr(r['Payment Status']) || null,
      uploaded_date: cleanStr(r['Upladed date']) || null,
      approved_by: cleanStr(r['Approved by']) || null,
      ...defaultStatus(),
    }));
}

function parseTransport(rows) {
  return rows
    .filter(r => cleanStr(r['Vendor Name ']))
    .map(r => ({
      id: genId('TRN'),
      module: 'transport',
      vendor_name: cleanStr(r['Vendor Name ']),
      invoice_number: cleanStr(r['Invoice No']),
      invoice_date: excelDateToStr(r['Invoice date ']),
      month: cleanStr(r['Month']),
      invoice_amount: cleanNum(r['Vendor amount ']),
      profit_loss: cleanNum(r['P/L amount']),
      city: cleanStr(r['City']) || null,
      payment_status: cleanStr(r['Payment done']) || null,
      uploaded_date: cleanStr(r['Uploaded date']) || null,
      approved_by: cleanStr(r['Approved by']) || null,
      ...defaultStatus(),
    }));
}

function parsePetty(rows) {
  return rows
    .filter(r => cleanStr(r['Vendor Name ']))
    .map(r => ({
      id: genId('PTY'),
      module: 'petty',
      vendor_name: cleanStr(r['Vendor Name ']),
      invoice_no: cleanStr(r['Invoice No']),
      description: cleanStr(r['Description ']),
      month: cleanStr(r['Month']),
      amount: cleanNum(r['Payable amount ']),
      payable_amount: cleanNum(r['Payable amount ']),
      remarks: cleanStr(r['Remarks']) || null,
      payment_status: cleanStr(r['Payment status ']) || null,
      uploaded_date: cleanStr(r['Upladed date']) || null,
      approved_by: cleanStr(r['Approved by']) || null,
      ...defaultStatus(),
    }));
}

function parseRefunds(rows) {
  return rows
    .filter(r => cleanStr(r['Customer id ']))
    .map(r => ({
      id: genId('REF'),
      module: 'refunds',
      date: cleanStr(r['Date ']),
      customer_id: cleanStr(r['Customer id ']),
      refund_amount: cleanNum(r['Refund amount ']),
      description: cleanStr(r['Discription ']),
      reason: cleanStr(r['Discription ']),
      refund_status: cleanStr(r['Refund status ']) || null,
      uploaded_date: cleanStr(r['uploaded date']) || null,
      ...defaultStatus(),
    }));
}

function parseHappy(rows) {
  return rows
    .filter(r => cleanStr(r['Vendor Name ']))
    .map(r => ({
      id: genId('HAP'),
      module: 'happy',
      vendor_name: cleanStr(r['Vendor Name ']),
      month: cleanStr(r['Month']),
      payable_amount: cleanNum(r['Payable amount ']),
      remarks: cleanStr(r['Remarks']) || null,
      payment_status: cleanStr(r['Payment status ']) || null,
      uploaded_date: cleanStr(r['Upladed date']) || null,
      approved_by: cleanStr(r['Approved by']) || null,
      ...defaultStatus(),
    }));
}

function parseDrive(rows) {
  return rows
    .filter(r => cleanStr(r['Particulars']) && cleanNum(r['Amount']))
    .map(r => ({
      id: genId('DRV'),
      module: 'drive',
      description: cleanStr(r['Particulars']),
      driver_name: cleanStr(r['Particulars']),
      month: cleanStr(r['Month']),
      amount: cleanNum(r['Amount']),
      date: cleanStr(r['Uploaded ']) || null,
      payment_status: cleanStr(r['Payment status ']) || null,
      payment_mode: cleanStr(r['Payment mode']) || null,
      ...defaultStatus(),
    }));
}

function parseReviews(rows) {
  return rows
    .filter(r => cleanStr(r['Name']))
    .map(r => ({
      id: genId('REV'),
      module: 'reviews',
      date: excelDateToStr(r['Date']),
      reviewer_name: cleanStr(r['Name']),
      rating: cleanNum(r['Remarks / Reviews']),
      city: cleanStr(r['City']) || null,
      amount: cleanNum(r['Amount']),
      ...defaultStatus(),
    }));
}

// ---- Batch insert (Supabase max ~1000 rows per request) ----

async function batchInsert(records) {
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('bills').insert(batch);
    if (error) {
      console.error(`  Insert error at batch ${i}: ${error.message}`);
      // Try one by one for this batch to find the problem row
      for (const row of batch) {
        const { error: rowErr } = await supabase.from('bills').insert(row);
        if (rowErr) {
          console.error(`  Row error [${row.id}]: ${rowErr.message}`);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }
  return inserted;
}

// ---- Main ----

async function main() {
  const filePath = process.argv[2] || '/Users/rameshm/Documents/Dev_Project/Accounts/Vendor bills_16_feb.xlsx';
  console.log(`Reading: ${filePath}`);
  const wb = XLSX.readFile(filePath);

  // Step 1: Delete all existing bills
  console.log('\n--- Deleting existing bills ---');
  // Supabase doesn't support DELETE without a filter, so delete by module
  const modules = ['transport', 'general', 'packing', 'petty', 'happy', 'refunds', 'drive', 'reviews'];
  for (const mod of modules) {
    const { error } = await supabase.from('bills').delete().eq('module', mod);
    if (error) console.error(`  Delete ${mod}: ${error.message}`);
    else console.log(`  Deleted ${mod}`);
  }

  // Step 2: Parse each sheet
  console.log('\n--- Parsing sheets ---');

  const sheetMap = {};
  for (const name of wb.SheetNames) {
    sheetMap[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
  }

  const generalRows = parseGeneral(sheetMap['General bills '] || []);
  console.log(`  General: ${generalRows.length} rows`);

  const packingRows = parsePacking(sheetMap['Packing materials bills'] || []);
  console.log(`  Packing: ${packingRows.length} rows`);

  const transportRows = parseTransport(sheetMap['Transport bills '] || []);
  console.log(`  Transport: ${transportRows.length} rows`);

  const pettyRows = parsePetty(sheetMap['All types of petty cash bills '] || []);
  console.log(`  Petty Cash: ${pettyRows.length} rows`);

  const refundRows = parseRefunds(sheetMap['Damage Refunds'] || []);
  console.log(`  Refunds: ${refundRows.length} rows`);

  const happyRows = parseHappy(sheetMap['Happay card'] || []);
  console.log(`  Happy Card: ${happyRows.length} rows`);

  const driveRows = parseDrive(sheetMap['Drive track and porter'] || []);
  console.log(`  Drive/Porter: ${driveRows.length} rows`);

  const reviewRows = parseReviews(sheetMap['Reviews'] || []);
  console.log(`  Reviews: ${reviewRows.length} rows`);

  // Step 3: Insert all
  console.log('\n--- Inserting into Supabase ---');

  const allSets = [
    { name: 'General', rows: generalRows },
    { name: 'Packing', rows: packingRows },
    { name: 'Transport', rows: transportRows },
    { name: 'Petty Cash', rows: pettyRows },
    { name: 'Refunds', rows: refundRows },
    { name: 'Happy Card', rows: happyRows },
    { name: 'Drive/Porter', rows: driveRows },
    { name: 'Reviews', rows: reviewRows },
  ];

  let totalInserted = 0;
  for (const { name, rows } of allSets) {
    if (rows.length === 0) {
      console.log(`  ${name}: 0 rows, skipping`);
      continue;
    }
    const count = await batchInsert(rows);
    console.log(`  ${name}: ${count}/${rows.length} inserted`);
    totalInserted += count;
  }

  console.log(`\n--- Done! Total: ${totalInserted} records inserted ---`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
