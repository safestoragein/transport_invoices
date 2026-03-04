/**
 * Calculate TDS (Tax Deducted at Source) amount and net payable
 * @param {number} amount - Invoice/payable amount
 * @param {number} tdsPercentage - TDS percentage (0-100)
 * @param {boolean} tdsApplicable - Whether TDS is applicable
 * @returns {{ tdsAmount: number, amountAfterTds: number }}
 */
export const calculateTDS = (amount, tdsPercentage, tdsApplicable = true) => {
  const amt = Number(amount) || 0;
  const pct = Number(tdsPercentage) || 0;
  if (!tdsApplicable || pct <= 0 || amt <= 0) return { tdsAmount: 0, amountAfterTds: amt, netPayable: amt };
  const tdsAmount = Math.round((amt * pct / 100) * 100) / 100;
  const amountAfterTds = Math.round((amt - tdsAmount) * 100) / 100;
  return { tdsAmount, amountAfterTds, netPayable: amountAfterTds };
};

/**
 * Calculate Final Payable for transport invoices
 * final_payable = amount_after_tds - penalty_amount (floor 0)
 * @param {number} payableAmount - Invoice/payable amount
 * @param {number} tdsPercentage - TDS percentage
 * @param {boolean} tdsApplicable - Whether TDS is applicable
 * @param {number} penaltyAmount - Penalty amount
 * @returns {{ tdsAmount, amountAfterTds, finalPayable }}
 */
export const calculateFinalPayable = (payableAmount, tdsPercentage, tdsApplicable, penaltyAmount) => {
  const { tdsAmount, amountAfterTds } = calculateTDS(payableAmount, tdsPercentage, tdsApplicable);
  const penalty = Number(penaltyAmount) || 0;
  const finalPayable = Math.max(0, Math.round((amountAfterTds - penalty) * 100) / 100);
  return { tdsAmount, amountAfterTds, finalPayable };
};

/**
 * Calculate Profit/Loss for Transport invoices
 * P/L = received_from_customer - packing_material - final_payable
 * MUST use final_payable (after TDS & penalty), not raw invoice amount
 * @param {number} receivedAmount - Amount received from customer
 * @param {number} packingMaterial - Packing material cost
 * @param {number} finalPayable - Final payable after TDS and penalty
 * @returns {number} Calculated profit/loss
 */
export const calculateProfitLoss = (receivedAmount, packingMaterial, finalPayable) => {
  const received = Number(receivedAmount) || 0;
  const packing = Number(packingMaterial) || 0;
  const payable = Number(finalPayable) || 0;
  return Math.round((received - packing - payable) * 100) / 100;
};

/**
 * Calculate all transport fields from raw inputs
 * Combines TDS, penalty, final_payable, and profit_loss calculations
 */
export const calculateTransportFields = (data) => {
  const invoiceAmount = Number(data.invoiceAmount) || 0;
  const tdsApplicable = Boolean(data.tdsApplicable);
  const tdsPercentage = Number(data.tdsPercentage) || 0;
  const penaltyAmount = Number(data.penaltyAmount) || 0;
  const receivedAmount = Number(data.receivedAmount) || 0;
  const packingMaterial = Number(data.packingMaterial) || 0;

  const { tdsAmount, amountAfterTds, finalPayable } = calculateFinalPayable(
    invoiceAmount, tdsPercentage, tdsApplicable, penaltyAmount
  );

  const profitLoss = calculateProfitLoss(receivedAmount, packingMaterial, finalPayable);

  return {
    tdsApplicable,
    tdsAmount,
    amountAfterTds,
    finalPayable,
    profitLoss,
    netPayable: finalPayable, // backward compat
  };
};

/**
 * Calculate payment status from bill_payments data
 * @param {number} finalPayable - Total amount due
 * @param {Array} payments - Array of payment records
 * @returns {{ totalPaid, remainingBalance, paymentStatus }}
 */
export const calculatePaymentStatus = (finalPayable, payments = []) => {
  const total = Number(finalPayable) || 0;
  const totalPaid = (payments || []).reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);
  const remainingBalance = Math.max(0, Math.round((total - totalPaid) * 100) / 100);

  let paymentStatus;
  if (totalPaid <= 0) {
    paymentStatus = 'Pending Payment';
  } else if (remainingBalance <= 0) {
    paymentStatus = 'Paid';
  } else {
    paymentStatus = 'Partially Paid';
  }

  return { totalPaid: Math.round(totalPaid * 100) / 100, remainingBalance, paymentStatus };
};

/**
 * Calculate group-level P&L for transport groups
 * @param {Array} invoices - Array of transport invoices in the group
 * @returns {object} Group totals
 */
export const calculateGroupTotals = (invoices) => {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return { totalReceived: 0, totalPackingMaterial: 0, totalInvoiceAmount: 0, totalTds: 0, totalPenalty: 0, totalFinalPayable: 0, totalProfit: 0, count: 0 };
  }

  return invoices.reduce((acc, inv) => ({
    totalReceived: acc.totalReceived + (Number(inv.receivedAmount) || 0),
    totalPackingMaterial: acc.totalPackingMaterial + (Number(inv.packingMaterial) || 0),
    totalInvoiceAmount: acc.totalInvoiceAmount + (Number(inv.invoiceAmount) || 0),
    totalTds: acc.totalTds + (Number(inv.tdsAmount) || 0),
    totalPenalty: acc.totalPenalty + (Number(inv.penaltyAmount) || 0),
    totalFinalPayable: acc.totalFinalPayable + (Number(inv.finalPayable) || 0),
    totalProfit: acc.totalProfit + (Number(inv.profitLoss) || 0),
    count: acc.count + 1,
  }), { totalReceived: 0, totalPackingMaterial: 0, totalInvoiceAmount: 0, totalTds: 0, totalPenalty: 0, totalFinalPayable: 0, totalProfit: 0, count: 0 });
};

/**
 * Calculate total for an array of items
 */
export const calculateTotal = (items, field) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
};

/**
 * Calculate statistics for a module
 */
export const calculateModuleStats = (items, amountField = 'amount') => {
  if (!Array.isArray(items) || items.length === 0) {
    return { totalAmount: 0, count: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0, averageAmount: 0 };
  }

  const totalAmount = calculateTotal(items, amountField);
  const pendingCount = items.filter(item =>
    item.status === 'pending_approval' || item.status === 'pending' ||
    item.status === 'awaiting_manager_approval' || item.status === 'awaiting_accounts_approval'
  ).length;
  const approvedCount = items.filter(item =>
    item.status === 'ready_for_upload' || item.status === 'approved' ||
    item.status === 'awaiting_payment' || item.status === 'closed' ||
    item.status === 'payment_done' || item.status === 'uploaded_to_bank' ||
    item.status === 'uploaded_for_payment'
  ).length;
  const rejectedCount = items.filter(item => item.status === 'rejected').length;

  return { totalAmount, count: items.length, pendingCount, approvedCount, rejectedCount, averageAmount: totalAmount / items.length };
};

/**
 * Calculate vendor-wise analytics
 */
export const calculateVendorAnalytics = (items, options = {}) => {
  const { amountField = 'finalPayable', profitField = 'profitLoss' } = options;
  if (!Array.isArray(items)) return [];

  const vendorMap = {};
  items.forEach(item => {
    const vendor = item.vendorName || 'Unknown';
    if (!vendorMap[vendor]) {
      vendorMap[vendor] = { vendor, totalAmount: 0, totalProfit: 0, count: 0, items: [] };
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
        monthlyData[monthKey] = { month: monthKey, totalAmount: 0, count: 0, items: [] };
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
 */
export const calculateApprovalStats = (items) => {
  if (!Array.isArray(items)) {
    return { pendingApproval: 0, readyForUpload: 0, uploadedToBank: 0, completed: 0, rejected: 0, onHold: 0, total: 0 };
  }

  return {
    pendingApproval: items.filter(item =>
      item.status === 'pending_approval' || item.status === 'pending' ||
      item.status === 'awaiting_manager_approval' || item.status === 'awaiting_accounts_approval'
    ).length,
    readyForUpload: items.filter(item =>
      item.status === 'ready_for_upload' || item.status === 'approved' || item.status === 'awaiting_payment'
    ).length,
    uploadedToBank: items.filter(item =>
      item.status === 'uploaded_to_bank' || item.status === 'uploaded_for_payment'
    ).length,
    completed: items.filter(item =>
      item.status === 'closed' || item.status === 'payment_done'
    ).length,
    rejected: items.filter(item => item.status === 'rejected').length,
    onHold: items.filter(item => item.status === 'on_hold').length,
    total: items.length,
  };
};

/**
 * Calculate Vendor Ledger entries
 * Debit = final_payable, Credit = payments
 */
export const calculateVendorLedger = (bills, payments = []) => {
  const vendorMap = {};

  bills.forEach(bill => {
    const vendor = bill.vendorName || 'Unknown';
    if (!vendorMap[vendor]) {
      vendorMap[vendor] = { vendor, debit: 0, credit: 0, bills: [], payments: [] };
    }
    const amount = Number(bill.finalPayable) || Number(bill.payableAmount) || Number(bill.amount) || 0;
    vendorMap[vendor].debit += amount;
    vendorMap[vendor].bills.push(bill);
  });

  payments.forEach(payment => {
    // Find the bill to get the vendor
    const bill = bills.find(b => b.id === payment.billId);
    if (!bill) return;
    const vendor = bill.vendorName || 'Unknown';
    if (!vendorMap[vendor]) {
      vendorMap[vendor] = { vendor, debit: 0, credit: 0, bills: [], payments: [] };
    }
    vendorMap[vendor].credit += Number(payment.paymentAmount) || 0;
    vendorMap[vendor].payments.push({ ...payment, billId: bill.id, invoiceNumber: bill.invoiceNumber || bill.invoiceNo });
  });

  return Object.values(vendorMap).map(v => ({
    ...v,
    balance: Math.round((v.debit - v.credit) * 100) / 100,
  })).sort((a, b) => b.debit - a.debit);
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
