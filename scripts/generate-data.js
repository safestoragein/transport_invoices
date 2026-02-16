/**
 * generate-data.js
 * Parses Vendor_bills_10_feb.xlsx and outputs JSON seed data for each module.
 *
 * Usage: node scripts/generate-data.js
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = path.resolve(__dirname, '../../Vendor_bills_10_feb.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../src/data');

// ── Helpers ──────────────────────────────────────────────────────────────────

let idCounter = 0;
function generateId() {
  idCounter += 1;
  return `seed-${Date.now()}-${idCounter}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Normalise any date value coming from xlsx into YYYY-MM-DD or '' if invalid.
 * Handles: Excel serial numbers, D/DDMMYYYY (7-8 digit numbers),
 *          DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD-MM-YY, DD/MM (no year),
 *          and ISO strings.
 */
function normalizeDate(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';

  if (typeof raw === 'number' && raw > 100) {
    // DDMMYYYY or DMMYYYY stored as number (7-8 digits, value > 1000000)
    if (raw > 1000000) {
      const s = String(raw).padStart(8, '0'); // pad 7-digit to 8
      const dd = s.slice(0, 2);
      const mm = s.slice(2, 4);
      const yyyy = s.slice(4, 8);
      const d = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
        return d.toISOString().slice(0, 10);
      }
    }
    // Standard Excel serial (typically 1-100000 range)
    if (raw < 100000) {
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      const d = new Date(excelEpoch.getTime() + raw * 86400000);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
        return d.toISOString().slice(0, 10);
      }
    }
    return '';
  }

  const s = String(raw).trim();
  if (!s) return '';

  // Try DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (4-digit year)
  const dmy4 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy4) {
    const [, dd, mm, yyyy] = dmy4;
    const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  // Try DD-MM-YY, DD/MM/YY (2-digit year)
  const dmy2 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (dmy2) {
    const [, dd, mm, yy] = dmy2;
    const yyyy = parseInt(yy) > 50 ? `19${yy}` : `20${yy}`;
    const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  // Try DD/MM (no year — assume 2024/2025 based on context)
  const dmOnly = s.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (dmOnly) {
    const [, dd, mm] = dmOnly;
    const d = new Date(`2024-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }

  // Try parsing as-is (ISO, etc.)
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
    return d.toISOString().slice(0, 10);
  }

  return '';
}

function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function str(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Normalize payment status strings from the Excel to match constants.js PAYMENT_STATUS values.
 */
function normalizePaymentStatus(raw) {
  const s = str(raw).toLowerCase().replace(/\s+/g, ' ').trim();
  if (!s) return 'Pending';
  if (s.includes('payment done') || s === 'processed') return 'Payment done';
  if (s.includes('hold')) return 'Hold';
  if (s.includes('partial')) return 'partially pending';
  return 'Pending';
}

/**
 * Wrap a mapped record with default workflow fields.
 */
function withDefaults(record) {
  return {
    id: generateId(),
    ...record,
    status: 'pending',
    managerApproval: 'pending',
    accountsApproval: 'pending',
    submittedBy: 'system',
    submittedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Sheet Mappers ────────────────────────────────────────────────────────────

function mapGeneralBills(rows) {
  return rows
    .filter(r => str(r['Vendor Name ']))
    .map(r => withDefaults({
      vendorName: str(r['Vendor Name ']),
      invoiceNo: str(r['Invoice No']),
      invoiceDate: normalizeDate(r['Invoice date ']),
      month: str(r['Month']),
      payableAmount: num(r['Payable amount ']),
      paymentStatus: normalizePaymentStatus(r['`']),
      uploadedDate: str(r['Upladed date']),
      approvedBy: str(r['Approved by']),
    }));
}

function mapTransportBills(rows) {
  return rows
    .filter(r => str(r['Vendor Name ']))
    .map(r => withDefaults({
      invoiceNumber: str(r['Invoice No']),
      vendorName: str(r['Vendor Name ']),
      city: str(r['City']),
      invoiceDate: normalizeDate(r['Invoice date ']),
      month: str(r['Month']),
      invoiceAmount: num(r['Vendor amount ']),
      profitLoss: num(r['P/L amount']),
      paymentStatus: normalizePaymentStatus(r['Payment done']),
      receivedAmount: 0,
      packingMaterial: 0,
      remarks: '',
    }));
}

function mapPackingMaterials(rows) {
  return rows
    .filter(r => str(r['Vendor Name ']))
    .map(r => withDefaults({
      vendorName: str(r['Vendor Name ']),
      invoiceNo: str(r['__EMPTY']) || '',
      invoiceDate: normalizeDate(r['Invoice date']),
      month: str(r['Month']),
      payableAmount: num(r['Payable amount']),
      paymentStatus: normalizePaymentStatus(r['Payment Status']),
      city: str(r['City']),
      submissionStatus: str(r['Submission Status']),
    }));
}

function mapPettyCash(rows) {
  return rows
    .filter(r => str(r['Vendor Name ']) || str(r['Invoice No']))
    .map(r => withDefaults({
      category: str(r['Vendor Name ']),
      particulars: str(r['Invoice No']),
      description: str(r['Description ']),
      date: normalizeDate(r['Month']) || '',
      amount: num(r['Payable amount ']),
      paymentStatus: normalizePaymentStatus(r['Payment status ']),
      remarks: str(r['Remarks']),
    }));
}

function mapRefunds(rows) {
  return rows
    .filter(r => str(r['Customer id ']))
    .map(r => withDefaults({
      customerId: str(r['Customer id ']),
      customerName: str(r['Customer id ']),
      refundAmount: num(r['Refund amount ']),
      reason: str(r['Discription ']),
      date: normalizeDate(r['Date ']),
      refundStatus: normalizePaymentStatus(r['Refund status ']),
    }));
}

function mapHappyCard(rows) {
  return rows
    .filter(r => str(r['Vendor Name ']))
    .map(r => withDefaults({
      vendorName: str(r['Vendor Name ']),
      month: str(r['Month']),
      payableAmount: num(r['Payable amount ']),
      paymentStatus: normalizePaymentStatus(r['Payment status ']),
      remarks: str(r['Remarks']),
      date: normalizeDate(r['Upladed date']),
    }));
}

function mapDriveTrackPorter(rows) {
  return rows
    .filter(r => str(r['Particulars']))
    .map(r => withDefaults({
      driverName: str(r['Particulars']),
      date: normalizeDate(r['Uploaded ']),
      month: str(r['Month']),
      distance: '',
      amount: num(r['Amount']),
      paymentMode: str(r['Payment mode']),
      paymentStatus: normalizePaymentStatus(r['Payment status ']),
    }));
}

function mapReviews(rows) {
  return rows
    .filter(r => str(r['Name']) || num(r['Amount']))
    .map(r => withDefaults({
      city: str(r['City']),
      rating: num(r['Remarks / Reviews']),
      amount: num(r['Amount']),
      date: normalizeDate(r['Date']),
      reviewerName: str(r['Name']),
    }));
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('Reading Excel file:', EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log('Sheets found:', wb.SheetNames.join(', '));

  // Helper to get sheet data by partial name match
  function getSheet(partialName) {
    const name = wb.SheetNames.find(n => n.toLowerCase().includes(partialName.toLowerCase()));
    if (!name) {
      console.warn(`  ⚠ Sheet matching "${partialName}" not found`);
      return [];
    }
    return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
  }

  const modules = {
    generalBills: mapGeneralBills(getSheet('General bills')),
    transportInvoices: mapTransportBills(getSheet('Transport bills')),
    packingMaterials: mapPackingMaterials(getSheet('Packing materials')),
    pettyCash: mapPettyCash(getSheet('petty cash')),
    refunds: mapRefunds(getSheet('Damage Refunds')),
    happyCard: mapHappyCard(getSheet('Happay card')),
    driveTrackPorter: mapDriveTrackPorter(getSheet('Drive track')),
    reviews: mapReviews(getSheet('Reviews')),
  };

  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write individual JSON files
  let totalRecords = 0;
  Object.entries(modules).forEach(([key, data]) => {
    const filePath = path.join(OUTPUT_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`  ✓ ${key}.json — ${data.length} records`);
    totalRecords += data.length;
  });

  // Write barrel export
  const indexContent = Object.keys(modules)
    .map(key => `export { default as ${key} } from './${key}.json';`)
    .join('\n') + '\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.js'), indexContent);
  console.log('  ✓ index.js — barrel export');

  console.log(`\nDone! ${totalRecords} total records across ${Object.keys(modules).length} modules.`);
}

main();
