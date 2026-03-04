/**
 * Test Suite: calculations.js
 * Verifies P/L calculation, module stats, and approval stats use new status values
 */
import {
  calculateProfitLoss,
  calculateTDS,
  calculateTotal,
  calculateModuleStats,
  calculateApprovalStats,
  calculatePercentageChange,
  generateId,
} from '../utils/calculations';

describe('calculateProfitLoss', () => {
  test('correct P/L: received - packing - invoice', () => {
    expect(calculateProfitLoss(10000, 1000, 7000)).toBe(2000);
  });

  test('negative P/L when costs exceed received', () => {
    expect(calculateProfitLoss(5000, 1000, 7000)).toBe(-3000);
  });

  test('handles zero values', () => {
    expect(calculateProfitLoss(0, 0, 0)).toBe(0);
  });

  test('handles null/undefined gracefully', () => {
    expect(calculateProfitLoss(null, undefined, '')).toBe(0);
  });

  test('handles string numbers', () => {
    expect(calculateProfitLoss('10000', '1000', '7000')).toBe(2000);
  });
});

describe('calculateTDS', () => {
  test('calculates TDS and net payable correctly', () => {
    const result = calculateTDS(10000, 2);
    expect(result.tdsAmount).toBe(200);
    expect(result.netPayable).toBe(9800);
    expect(result.amountAfterTds).toBe(9800);
  });

  test('returns zero TDS when percentage is 0', () => {
    const result = calculateTDS(10000, 0);
    expect(result.tdsAmount).toBe(0);
    expect(result.netPayable).toBe(10000);
  });

  test('returns zero when amount is 0', () => {
    const result = calculateTDS(0, 10);
    expect(result.tdsAmount).toBe(0);
    expect(result.netPayable).toBe(0);
  });

  test('handles null/undefined gracefully', () => {
    const result = calculateTDS(null, null);
    expect(result.tdsAmount).toBe(0);
    expect(result.netPayable).toBe(0);
  });

  test('rounds to 2 decimal places', () => {
    const result = calculateTDS(1000, 3.33);
    expect(result.tdsAmount).toBe(33.3);
    expect(result.netPayable).toBe(966.7);
  });
});

describe('calculateTotal', () => {
  test('sums a field across items', () => {
    const items = [{ amount: 100 }, { amount: 200 }, { amount: 300 }];
    expect(calculateTotal(items, 'amount')).toBe(600);
  });

  test('returns 0 for empty array', () => {
    expect(calculateTotal([], 'amount')).toBe(0);
  });

  test('returns 0 for non-array', () => {
    expect(calculateTotal(null, 'amount')).toBe(0);
  });

  test('handles missing fields as 0', () => {
    const items = [{ amount: 100 }, { other: 200 }];
    expect(calculateTotal(items, 'amount')).toBe(100);
  });
});

describe('calculateModuleStats', () => {
  const items = [
    { status: 'pending_approval', amount: 100 },
    { status: 'pending_approval', amount: 200 },
    { status: 'approved', amount: 300 },
    { status: 'closed', amount: 400 },
    { status: 'rejected', amount: 50 },
  ];

  test('counts entries correctly', () => {
    const stats = calculateModuleStats(items, 'amount');
    expect(stats.count).toBe(5);
    expect(stats.totalAmount).toBe(1050);
  });

  test('pendingCount uses pending_approval status', () => {
    const stats = calculateModuleStats(items, 'amount');
    expect(stats.pendingCount).toBe(2);
  });

  test('approvedCount includes approved AND closed', () => {
    const stats = calculateModuleStats(items, 'amount');
    expect(stats.approvedCount).toBe(2);
  });

  test('rejectedCount uses rejected status', () => {
    const stats = calculateModuleStats(items, 'amount');
    expect(stats.rejectedCount).toBe(1);
  });

  test('returns zeros for empty array', () => {
    const stats = calculateModuleStats([]);
    expect(stats.count).toBe(0);
    expect(stats.totalAmount).toBe(0);
    expect(stats.pendingCount).toBe(0);
    expect(stats.approvedCount).toBe(0);
    expect(stats.rejectedCount).toBe(0);
  });
});

describe('calculateApprovalStats', () => {
  const items = [
    { status: 'pending_approval' },
    { status: 'pending_approval' },
    { status: 'approved' },
    { status: 'closed' },
    { status: 'closed' },
    { status: 'rejected' },
  ];

  test('pendingApproval count is correct', () => {
    const stats = calculateApprovalStats(items);
    expect(stats.pendingApproval).toBe(2);
  });

  test('readyForUpload counts approved entries', () => {
    const stats = calculateApprovalStats(items);
    expect(stats.readyForUpload).toBe(1);
  });

  test('completed counts closed entries', () => {
    const stats = calculateApprovalStats(items);
    expect(stats.completed).toBe(2);
  });

  test('rejected count is correct', () => {
    const stats = calculateApprovalStats(items);
    expect(stats.rejected).toBe(1);
  });

  test('total count is correct', () => {
    const stats = calculateApprovalStats(items);
    expect(stats.total).toBe(6);
  });

  test('does NOT have old fields pendingManager/pendingAccounts', () => {
    const stats = calculateApprovalStats(items);
    expect(stats.pendingManager).toBeUndefined();
    expect(stats.pendingAccounts).toBeUndefined();
  });

  test('handles null input', () => {
    const stats = calculateApprovalStats(null);
    expect(stats.pendingApproval).toBe(0);
    expect(stats.total).toBe(0);
  });
});

describe('calculatePercentageChange', () => {
  test('calculates positive change', () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
  });

  test('calculates negative change', () => {
    expect(calculatePercentageChange(50, 100)).toBe(-50);
  });

  test('handles zero previous', () => {
    expect(calculatePercentageChange(100, 0)).toBe(100);
  });
});

describe('generateId', () => {
  test('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  test('generates string IDs', () => {
    expect(typeof generateId()).toBe('string');
  });

  test('ID has expected format (timestamp-random)', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});
