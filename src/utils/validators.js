/**
 * Validation utility functions
 */

/**
 * Check if a value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null
 */
export const validateRequired = (value, fieldName) => {
  if (isEmpty(value)) {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null
 */
export const validateEmail = (email) => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

/**
 * Validate number
 * @param {*} value - Value to validate
 * @param {object} options - Validation options
 * @returns {string|null} Error message or null
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, required = false, fieldName = 'Value' } = options;

  if (isEmpty(value)) {
    return required ? `${fieldName} is required` : null;
  }

  const num = Number(value);

  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }

  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }

  if (max !== undefined && num > max) {
    return `${fieldName} must be at most ${max}`;
  }

  return null;
};

/**
 * Validate date
 * @param {string} date - Date string to validate
 * @param {object} options - Validation options
 * @returns {string|null} Error message or null
 */
export const validateDate = (date, options = {}) => {
  const { required = false, fieldName = 'Date', minDate, maxDate } = options;

  if (isEmpty(date)) {
    return required ? `${fieldName} is required` : null;
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return `${fieldName} is not a valid date`;
  }

  if (minDate && dateObj < new Date(minDate)) {
    return `${fieldName} must be after ${minDate}`;
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return `${fieldName} must be before ${maxDate}`;
  }

  return null;
};

/**
 * Validate text length
 * @param {string} text - Text to validate
 * @param {object} options - Validation options
 * @returns {string|null} Error message or null
 */
export const validateLength = (text, options = {}) => {
  const { min, max, required = false, fieldName = 'Field' } = options;

  if (isEmpty(text)) {
    return required ? `${fieldName} is required` : null;
  }

  const length = String(text).length;

  if (min !== undefined && length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }

  if (max !== undefined && length > max) {
    return `${fieldName} must be at most ${max} characters`;
  }

  return null;
};

/**
 * Validate invoice form
 * @param {object} data - Form data
 * @returns {object} Validation result { isValid, errors }
 */
export const validateInvoiceForm = (data) => {
  const errors = {};

  // Required fields
  const requiredFields = [
    { field: 'invoiceNumber', name: 'Invoice Number' },
    { field: 'vendorName', name: 'Vendor Name' },
    { field: 'invoiceDate', name: 'Invoice Date' },
    { field: 'invoiceAmount', name: 'Invoice Amount' },
  ];

  requiredFields.forEach(({ field, name }) => {
    const error = validateRequired(data[field], name);
    if (error) errors[field] = error;
  });

  // Validate amounts
  if (data.invoiceAmount) {
    const amountError = validateNumber(data.invoiceAmount, {
      min: 0,
      fieldName: 'Invoice Amount',
    });
    if (amountError) errors.invoiceAmount = amountError;
  }

  if (data.packingMaterial) {
    const packingError = validateNumber(data.packingMaterial, {
      min: 0,
      fieldName: 'Packing Material',
    });
    if (packingError) errors.packingMaterial = packingError;
  }

  if (data.receivedAmount) {
    const receivedError = validateNumber(data.receivedAmount, {
      min: 0,
      fieldName: 'Received Amount',
    });
    if (receivedError) errors.receivedAmount = receivedError;
  }

  // Validate date
  if (data.invoiceDate) {
    const dateError = validateDate(data.invoiceDate, {
      fieldName: 'Invoice Date',
    });
    if (dateError) errors.invoiceDate = dateError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate general bill form
 * @param {object} data - Form data
 * @returns {object} Validation result { isValid, errors }
 */
export const validateGeneralBillForm = (data) => {
  const errors = {};

  const requiredFields = [
    { field: 'vendorName', name: 'Vendor Name' },
    { field: 'invoiceNo', name: 'Invoice Number' },
    { field: 'invoiceDate', name: 'Invoice Date' },
    { field: 'payableAmount', name: 'Payable Amount' },
  ];

  requiredFields.forEach(({ field, name }) => {
    const error = validateRequired(data[field], name);
    if (error) errors[field] = error;
  });

  if (data.payableAmount) {
    const amountError = validateNumber(data.payableAmount, {
      min: 0,
      fieldName: 'Payable Amount',
    });
    if (amountError) errors.payableAmount = amountError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
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
 * @param {Array} rows - Imported rows
 * @param {object} requiredColumns - Required column mappings
 * @returns {object} Validation result { isValid, errors, validRows }
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

  return {
    isValid: errors.length === 0,
    errors,
    validRows,
    invalidCount: rows.length - validRows.length,
  };
};
