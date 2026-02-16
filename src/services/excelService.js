import * as XLSX from 'xlsx';
import { formatDate, formatCurrency } from '../utils/formatters';
import { MODULE_CONFIG } from '../utils/constants';

/**
 * Excel Service - Handles Excel import/export operations
 */
class ExcelService {
  /**
   * Export data to Excel file
   * @param {Array} data - Data to export
   * @param {object} options - Export options
   */
  exportToExcel(data, options = {}) {
    const {
      filename = 'export',
      sheetName = 'Data',
      columns,
      formatters = {},
    } = options;

    // Prepare data for export
    const exportData = data.map((row) => {
      const exportRow = {};

      if (columns) {
        // Use specified columns
        columns.forEach((col) => {
          const value = row[col.key];
          if (formatters[col.key]) {
            exportRow[col.header || col.key] = formatters[col.key](value, row);
          } else if (col.format === 'currency') {
            exportRow[col.header || col.key] = formatCurrency(value, false);
          } else if (col.format === 'date') {
            exportRow[col.header || col.key] = formatDate(value);
          } else {
            exportRow[col.header || col.key] = value ?? '';
          }
        });
      } else {
        // Export all fields
        Object.entries(row).forEach(([key, value]) => {
          // Skip internal fields
          if (['createdAt', 'updatedAt', 'id'].includes(key)) return;
          exportRow[key] = value ?? '';
        });
      }

      return exportRow;
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Auto-size columns
    const colWidths = this.calculateColumnWidths(exportData);
    ws['!cols'] = colWidths;

    // Generate and download file
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
  }

  /**
   * Calculate column widths based on content
   */
  calculateColumnWidths(data) {
    if (!data.length) return [];

    const headers = Object.keys(data[0]);
    return headers.map((header) => {
      let maxWidth = header.length;

      data.forEach((row) => {
        const value = String(row[header] || '');
        if (value.length > maxWidth) {
          maxWidth = value.length;
        }
      });

      return { wch: Math.min(maxWidth + 2, 50) };
    });
  }

  /**
   * Read Excel file and return data
   * @param {File} file - Excel file
   * @returns {Promise<object>} Parsed data
   */
  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Get headers from first row
          const headers = jsonData[0] || [];
          const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell));

          // Convert to objects
          const parsedData = rows.map((row) => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve({
            headers,
            rows: parsedData,
            sheetName,
            totalRows: parsedData.length,
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Map imported data to target schema
   * @param {Array} data - Raw imported data
   * @param {object} mapping - Column mapping { sourceColumn: targetField }
   * @param {object} options - Import options
   */
  mapImportedData(data, mapping, options = {}) {
    const { defaultValues = {}, transformers = {} } = options;

    return data.map((row) => {
      const mappedRow = { ...defaultValues };

      Object.entries(mapping).forEach(([source, target]) => {
        if (target && row[source] !== undefined) {
          let value = row[source];

          // Apply transformer if exists
          if (transformers[target]) {
            value = transformers[target](value, row);
          }

          mappedRow[target] = value;
        }
      });

      return mappedRow;
    });
  }

  /**
   * Validate imported data
   * @param {Array} data - Data to validate
   * @param {object} schema - Validation schema
   */
  validateImportedData(data, schema) {
    const errors = [];
    const validRows = [];

    data.forEach((row, index) => {
      const rowErrors = [];

      Object.entries(schema).forEach(([field, rules]) => {
        const value = row[field];

        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
          rowErrors.push(`Row ${index + 1}: ${field} is required`);
        }

        // Type check
        if (value !== undefined && value !== null && value !== '') {
          if (rules.type === 'number' && isNaN(Number(value))) {
            rowErrors.push(`Row ${index + 1}: ${field} must be a number`);
          }

          if (rules.type === 'date') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              rowErrors.push(`Row ${index + 1}: ${field} must be a valid date`);
            }
          }
        }

        // Min/Max for numbers
        if (rules.type === 'number' && !isNaN(Number(value))) {
          const num = Number(value);
          if (rules.min !== undefined && num < rules.min) {
            rowErrors.push(`Row ${index + 1}: ${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            rowErrors.push(`Row ${index + 1}: ${field} must be at most ${rules.max}`);
          }
        }
      });

      if (rowErrors.length === 0) {
        validRows.push(row);
      } else {
        errors.push(...rowErrors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRows,
      invalidCount: data.length - validRows.length,
    };
  }

  /**
   * Get export columns configuration for a module
   */
  getModuleExportColumns(module) {
    const commonColumns = [
      { key: 'id', header: 'ID' },
      { key: 'status', header: 'Status' },
      { key: 'approvedBy', header: 'Approved By' },
      { key: 'paymentMode', header: 'Payment Mode' },
      { key: 'submittedBy', header: 'Submitted By' },
    ];

    const moduleColumns = {
      transport: [
        { key: 'invoiceNumber', header: 'Invoice Number' },
        { key: 'vendorName', header: 'Vendor Name' },
        { key: 'city', header: 'City' },
        { key: 'invoiceDate', header: 'Invoice Date', format: 'date' },
        { key: 'packingMaterial', header: 'Packing Material', format: 'currency' },
        { key: 'receivedAmount', header: 'Received Amount', format: 'currency' },
        { key: 'invoiceAmount', header: 'Invoice Amount', format: 'currency' },
        { key: 'profitLoss', header: 'Profit/Loss', format: 'currency' },
        { key: 'remarks', header: 'Remarks' },
      ],
      general: [
        { key: 'vendorName', header: 'Vendor Name' },
        { key: 'invoiceNo', header: 'Invoice Number' },
        { key: 'invoiceDate', header: 'Invoice Date', format: 'date' },
        { key: 'month', header: 'Month' },
        { key: 'payableAmount', header: 'Payable Amount', format: 'currency' },
        { key: 'paymentStatus', header: 'Payment Status' },
        { key: 'approvedBy', header: 'Approved By' },
      ],
      packing: [
        { key: 'vendorName', header: 'Vendor Name' },
        { key: 'invoiceNo', header: 'Invoice Number' },
        { key: 'invoiceDate', header: 'Invoice Date', format: 'date' },
        { key: 'payableAmount', header: 'Payable Amount', format: 'currency' },
        { key: 'paymentStatus', header: 'Payment Status' },
      ],
      petty: [
        { key: 'category', header: 'Category' },
        { key: 'particulars', header: 'Particulars' },
        { key: 'date', header: 'Date', format: 'date' },
        { key: 'amount', header: 'Amount', format: 'currency' },
      ],
      happy: [
        { key: 'vendorName', header: 'Vendor Name' },
        { key: 'month', header: 'Month' },
        { key: 'payableAmount', header: 'Amount', format: 'currency' },
      ],
      refunds: [
        { key: 'customerId', header: 'Customer ID' },
        { key: 'customerName', header: 'Customer Name' },
        { key: 'refundAmount', header: 'Refund Amount', format: 'currency' },
        { key: 'reason', header: 'Reason' },
        { key: 'date', header: 'Date', format: 'date' },
      ],
      drive: [
        { key: 'driverName', header: 'Driver Name' },
        { key: 'date', header: 'Date', format: 'date' },
        { key: 'distance', header: 'Distance' },
        { key: 'amount', header: 'Amount', format: 'currency' },
        { key: 'paymentMode', header: 'Payment Mode' },
      ],
      reviews: [
        { key: 'city', header: 'City' },
        { key: 'rating', header: 'Rating' },
        { key: 'amount', header: 'Amount', format: 'currency' },
        { key: 'date', header: 'Date', format: 'date' },
      ],
    };

    return [...(moduleColumns[module] || []), ...commonColumns];
  }

  /**
   * Get import schema for a module
   */
  getModuleImportSchema(module) {
    const schemas = {
      transport: {
        invoiceNumber: { required: true },
        vendorName: { required: true },
        city: { required: false },
        invoiceDate: { required: true, type: 'date' },
        packingMaterial: { type: 'number', min: 0 },
        receivedAmount: { type: 'number', min: 0 },
        invoiceAmount: { required: true, type: 'number', min: 0 },
      },
      general: {
        vendorName: { required: true },
        invoiceNo: { required: true },
        invoiceDate: { required: true, type: 'date' },
        payableAmount: { required: true, type: 'number', min: 0 },
      },
      // Add other modules as needed
    };

    return schemas[module] || {};
  }
}

// Export singleton instance
export const excelService = new ExcelService();
export default excelService;
