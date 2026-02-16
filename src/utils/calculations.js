/**
 * Calculate Profit/Loss for Transport invoices
 * P/L = Received Amount - Packing Material - Invoice Amount
 * @param {number} receivedAmount - Amount received from customer
 * @param {number} packingMaterial - Packing material cost
 * @param {number} invoiceAmount - Invoice amount
 * @returns {number} Calculated profit/loss
 */
export const calculateProfitLoss = (receivedAmount, packingMaterial, invoiceAmount) => {
  const received = Number(receivedAmount) || 0;
  const packing = Number(packingMaterial) || 0;
  const invoice = Number(invoiceAmount) || 0;

  return received - packing - invoice;
};

/**
 * Calculate total for an array of items
 * @param {Array} items - Array of items
 * @param {string} field - Field name to sum
 * @returns {number} Total sum
 */
export const calculateTotal = (items, field) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
};

/**
 * Calculate statistics for a module
 * @param {Array} items - Array of items
 * @param {string} amountField - Field name for amount
 * @returns {object} Statistics object
 */
export const calculateModuleStats = (items, amountField = 'amount') => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      totalAmount: 0,
      count: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      averageAmount: 0,
    };
  }

  const totalAmount = calculateTotal(items, amountField);
  const pendingCount = items.filter(item =>
    item.status === 'pending_approval'
  ).length;
  const approvedCount = items.filter(item =>
    item.status === 'approved' ||
    item.status === 'closed'
  ).length;
  const rejectedCount = items.filter(item =>
    item.status === 'rejected'
  ).length;

  return {
    totalAmount,
    count: items.length,
    pendingCount,
    approvedCount,
    rejectedCount,
    averageAmount: items.length > 0 ? totalAmount / items.length : 0,
  };
};

/**
 * Calculate vendor-wise analytics
 * @param {Array} items - Array of items
 * @param {object} options - Options for calculation
 * @returns {Array} Array of vendor analytics
 */
export const calculateVendorAnalytics = (items, options = {}) => {
  const { amountField = 'invoiceAmount', profitField = 'profitLoss' } = options;

  if (!Array.isArray(items)) return [];

  const vendorMap = {};

  items.forEach(item => {
    const vendor = item.vendorName || 'Unknown';

    if (!vendorMap[vendor]) {
      vendorMap[vendor] = {
        vendor,
        totalAmount: 0,
        totalProfit: 0,
        count: 0,
        items: [],
      };
    }

    vendorMap[vendor].totalAmount += Number(item[amountField]) || 0;
    vendorMap[vendor].totalProfit += Number(item[profitField]) || 0;
    vendorMap[vendor].count += 1;
    vendorMap[vendor].items.push(item);
  });

  return Object.values(vendorMap).sort((a, b) => b.totalAmount - a.totalAmount);
};

/**
 * Calculate monthly breakdown
 * @param {Array} items - Array of items
 * @param {string} dateField - Field name for date
 * @param {string} amountField - Field name for amount
 * @returns {object} Monthly breakdown
 */
export const calculateMonthlyBreakdown = (items, dateField = 'invoiceDate', amountField = 'amount') => {
  if (!Array.isArray(items)) return {};

  const monthlyData = {};

  items.forEach(item => {
    const dateStr = item[dateField];
    if (!dateStr) return;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalAmount: 0,
          count: 0,
          items: [],
        };
      }

      monthlyData[monthKey].totalAmount += Number(item[amountField]) || 0;
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].items.push(item);
    } catch {
      // Skip invalid dates
    }
  });

  return monthlyData;
};

/**
 * Calculate approval workflow statistics
 * @param {Array} items - Array of items across all modules
 * @returns {object} Approval statistics
 */
export const calculateApprovalStats = (items) => {
  if (!Array.isArray(items)) {
    return {
      pendingApproval: 0,
      awaitingPayment: 0,
      completed: 0,
      rejected: 0,
      total: 0,
    };
  }

  return {
    pendingApproval: items.filter(item => item.status === 'pending_approval').length,
    awaitingPayment: items.filter(item => item.status === 'approved').length,
    completed: items.filter(item => item.status === 'closed').length,
    rejected: items.filter(item => item.status === 'rejected').length,
    total: items.length,
  };
};

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
