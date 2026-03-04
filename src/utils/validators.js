/**
 * Validation utility functions
 */

import { STATUS_VALUES } from './constants';

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const validateRequired = (value, fieldName) => {
  if (isEmpty(value)) return `${fieldName} is required`;
  return null;
};

export const validateEmail = (email) => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
};

export const validateNumber = (value, options = {}) => {
  const { min, max, required = false, fieldName = 'Value' } = options;
  if (isEmpty(value)) return required ? `${fieldName} is required` : null;
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (min !== undefined && num < min) return `${fieldName} must be at least ${min}`;
  if (max !== undefined && num > max) return `${fieldName} must be at most ${max}`;
  return null;
};

export const validateDate = (date, options = {}) => {
  const { required = false, fieldName = 'Date', minDate, maxDate } = options;
  if (isEmpty(date)) return required ? `${fieldName} is required` : null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return `${fieldName} is not a valid date`;
  if (minDate && dateObj < new Date(minDate)) return `${fieldName} must be after ${minDate}`;
  if (maxDate && dateObj > new Date(maxDate)) return `${fieldName} must be before ${maxDate}`;
  return null;
};

export const validateLength = (text, options = {}) => {
  const { min, max, required = false, fieldName = 'Field' } = options;
  if (isEmpty(text)) return required ? `${fieldName} is required` : null;
  const length = String(text).length;
  if (min !== undefined && length < min) return `${fieldName} must be at least ${min} characters`;
  if (max !== undefined && length > max) return `${fieldName} must be at most ${max} characters`;
  return null;
};

/**
 * Validate invoice form (transport)
 */
export const validateInvoiceForm = (data) => {
  const errors = {};

  const requiredFields = [
    { field: 'vendorName', name: 'Vendor Name' },
    { field: 'invoiceDate', name: 'Invoice Date' },
    { field: 'invoiceAmount', name: 'Invoice Amount' },
    { field: 'paymentMode', name: 'Payment Mode' },
  ];

  requiredFields.forEach(({ field, name }) => {
    const error = validateRequired(data[field], name);
    if (error) errors[field] = error;
  });

  if (data.invoiceAmount) {
    const amountError = validateNumber(data.invoiceAmount, { min: 0, fieldName: 'Invoice Amount' });
    if (amountError) errors.invoiceAmount = amountError;
  }

  if (data.packingMaterial) {
    const packingError = validateNumber(data.packingMaterial, { min: 0, fieldName: 'Packing Material' });
    if (packingError) errors.packingMaterial = packingError;
  }

  if (data.receivedAmount) {
    const receivedError = validateNumber(data.receivedAmount, { min: 0, fieldName: 'Received Amount' });
    if (receivedError) errors.receivedAmount = receivedError;
  }

  if (data.penaltyAmount) {
    const penaltyError = validateNumber(data.penaltyAmount, { min: 0, fieldName: 'Penalty Amount' });
    if (penaltyError) errors.penaltyAmount = penaltyError;
  }

  if (data.tdsPercentage) {
    const tdsError = validateNumber(data.tdsPercentage, { min: 0, max: 100, fieldName: 'TDS Percentage' });
    if (tdsError) errors.tdsPercentage = tdsError;
  }

  if (data.invoiceDate) {
    const dateError = validateDate(data.invoiceDate, { fieldName: 'Invoice Date' });
    if (dateError) errors.invoiceDate = dateError;
  }

  if (data.dueDate) {
    const dueDateError = validateDate(data.dueDate, { fieldName: 'Due Date' });
    if (dueDateError) errors.dueDate = dueDateError;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Validate general bill form
 */
export const validateGeneralBillForm = (data) => {
  const errors = {};

  const requiredFields = [
    { field: 'vendorName', name: 'Vendor Name' },
    { field: 'invoiceNo', name: 'Invoice Number' },
    { field: 'invoiceDate', name: 'Invoice Date' },
    { field: 'payableAmount', name: 'Payable Amount' },
    { field: 'paymentMode', name: 'Payment Mode' },
  ];

  requiredFields.forEach(({ field, name }) => {
    const error = validateRequired(data[field], name);
    if (error) errors[field] = error;
  });

  if (data.payableAmount) {
    const amountError = validateNumber(data.payableAmount, { min: 0, fieldName: 'Payable Amount' });
    if (amountError) errors.payableAmount = amountError;
  }

  if (data.dueDate) {
    const dueDateError = validateDate(data.dueDate, { fieldName: 'Due Date' });
    if (dueDateError) errors.dueDate = dueDateError;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Check for duplicate invoice number
 * @param {string} invoiceNumber - Invoice number to check
 * @param {Array} existingBills - Existing bills to check against
 * @param {string} excludeId - ID to exclude (for edits)
 * @returns {string|null} Error message or null
 */
export const validateDuplicateInvoice = (invoiceNumber, existingBills, excludeId = null) => {
  if (!invoiceNumber || !Array.isArray(existingBills)) return null;
  const duplicate = existingBills.find(bill =>
    (bill.invoiceNumber === invoiceNumber || bill.invoiceNo === invoiceNumber) &&
    bill.id !== excludeId
  );
  if (duplicate) return `Invoice number "${invoiceNumber}" already exists (Bill ID: ${duplicate.id})`;
  return null;
};

/**
 * Validate payment amount (prevent overpayment)
 * @param {number} paymentAmount - Amount being paid
 * @param {number} finalPayable - Total amount due
 * @param {number} totalPaid - Total already paid
 * @returns {string|null} Error message or null
 */
export const validatePaymentAmount = (paymentAmount, finalPayable, totalPaid = 0) => {
  const amount = Number(paymentAmount) || 0;
  const total = Number(finalPayable) || 0;
  const paid = Number(totalPaid) || 0;

  if (amount <= 0) return 'Payment amount must be greater than zero';
  const remaining = total - paid;
  if (amount > remaining + 0.01) { // small tolerance for rounding
    return `Payment amount (${amount}) exceeds remaining balance (${remaining.toFixed(2)})`;
  }
  return null;
};

/**
 * Check if a bill can be edited (not after PAYMENT_DONE)
 * @param {object} bill - The bill to check
 * @returns {boolean} Whether the bill can be edited
 */
export const canEditBill = (bill) => {
  if (!bill) return false;
  return bill.status !== STATUS_VALUES.PAYMENT_DONE &&
         bill.status !== 'payment_done' &&
         bill.status !== 'closed';
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate Excel import data
 */
export const validateExcelImport = (rows, requiredColumns) => {
  const errors = [];
  const validRows = [];

  rows.forEach((row, index) => {
    const rowErrors = [];
    Object.entries(requiredColumns).forEach(([column, options]) => {
      if (options.required && isEmpty(row[column])) {
        rowErrors.push(`Row ${index + 1}: ${column} is required`);
      }
      if (options.type === 'number' && row[column] && isNaN(Number(row[column]))) {
        rowErrors.push(`Row ${index + 1}: ${column} must be a number`);
      }
      if (options.type === 'date' && row[column]) {
        const dateError = validateDate(row[column], { fieldName: column });
        if (dateError) rowErrors.push(`Row ${index + 1}: ${dateError}`);
      }
    });

    if (rowErrors.length === 0) {
      validRows.push(row);
    } else {
      errors.push(...rowErrors);
    }
  });

  return { isValid: errors.length === 0, errors, validRows, invalidCount: rows.length - validRows.length };
};
