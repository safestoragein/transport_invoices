/**
 * Format amount as Indian currency (₹)
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }

  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format date for display
 * @param {string|Date} date - The date to format
 * @param {string} format - Format style: 'short', 'long', 'iso'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return date; // Return original if invalid

    const options = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: 'numeric', month: 'long', year: 'numeric' },
      iso: undefined, // Will use toISOString
    };

    if (format === 'iso') {
      return dateObj.toISOString().split('T')[0];
    }

    return dateObj.toLocaleDateString('en-IN', options[format] || options.short);
  } catch {
    return date;
  }
};

/**
 * Format date and time for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date-time string
 */
export const formatDateTime = (date) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return date;

    return dateObj.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
};

/**
 * Format month-year from date
 * @param {string|Date} date - The date
 * @returns {string} Month Year format (e.g., "January 2024")
 */
export const formatMonthYear = (date) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return date;

    return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    return date;
  }
};

/**
 * Format percentage
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format number with Indian number system (lakhs, crores)
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return Number(num).toLocaleString('en-IN');
};

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format status for display
 * @param {string} status - The status value
 * @returns {string} Formatted status string
 */
export const formatStatus = (status) => {
  if (!status) return '-';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Format profit/loss with color indication
 * @param {number} value - The P/L value
 * @returns {object} Object with formatted value and color class
 */
export const formatProfitLoss = (value) => {
  const amount = Number(value) || 0;
  const formatted = formatCurrency(Math.abs(amount));

  return {
    value: amount >= 0 ? `+${formatted}` : `-${formatted}`,
    isProfit: amount >= 0,
    className: amount >= 0 ? 'text-success-600' : 'text-danger-600',
  };
};

/**
 * Parse date string to Date object
 * Handles various date formats
 * @param {string} dateStr - The date string to parse
 * @returns {Date|null} Parsed date or null
 */
export const parseDate = (dateStr) => {
  if (!dateStr) return null;

  // Try ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Try DD.MM.YYYY format
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    date = new Date(dotMatch[3], dotMatch[2] - 1, dotMatch[1]);
    if (!isNaN(date.getTime())) return date;
  }

  // Try DD/MM/YYYY format
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\.?(\d{4})$/);
  if (slashMatch) {
    date = new Date(slashMatch[3], slashMatch[2] - 1, slashMatch[1]);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};
