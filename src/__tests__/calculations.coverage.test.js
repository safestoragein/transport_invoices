/**
 * Coverage Test: calculations.js — vendor analytics + monthly breakdown
 * Covers the functions not tested in the original calculations.test.js
 */
import {
  calculateVendorAnalytics,
  calculateMonthlyBreakdown,
} from '../utils/calculations';

describe('calculateVendorAnalytics', () => {
  const items = [
    { vendorName: 'ABC Transport', finalPayable: 5000, profitLoss: 800 },
    { vendorName: 'ABC Transport', finalPayable: 3000, profitLoss: 200 },
    { vendorName: 'XYZ Logistics', finalPayable: 7000, profitLoss: -500 },
    { vendorName: 'ABC Transport', finalPayable: 2000, profitLoss: 100 },
  ];

  test('groups items by vendor', () => {
    const result = calculateVendorAnalytics(items);
    expect(result).toHaveLength(2);
  });

  test('calculates total amount per vendor', () => {
    const result = calculateVendorAnalytics(items);
    const abc = result.find(v => v.vendor === 'ABC Transport');
    expect(abc.totalAmount).toBe(10000);
    expect(abc.count).toBe(3);
  });

  test('calculates total profit per vendor', () => {
    const result = calculateVendorAnalytics(items);
    const abc = result.find(v => v.vendor === 'ABC Transport');
    expect(abc.totalProfit).toBe(1100); // 800 + 200 + 100
  });

  test('sorts by total amount descending', () => {
    const result = calculateVendorAnalytics(items);
    expect(result[0].vendor).toBe('ABC Transport'); // 10000
    expect(result[1].vendor).toBe('XYZ Logistics'); // 7000
  });

  test('handles missing vendorName as "Unknown"', () => {
    const result = calculateVendorAnalytics([
      { finalPayable: 1000, profitLoss: 100 },
    ]);
    expect(result[0].vendor).toBe('Unknown');
  });

  test('handles non-array input', () => {
    expect(calculateVendorAnalytics(null)).toEqual([]);
    expect(calculateVendorAnalytics(undefined)).toEqual([]);
    expect(calculateVendorAnalytics('string')).toEqual([]);
  });

  test('handles empty array', () => {
    expect(calculateVendorAnalytics([])).toEqual([]);
  });

  test('uses custom amount and profit fields', () => {
    const items = [
      { vendorName: 'Test', payableAmount: 1000, customProfit: 200 },
      { vendorName: 'Test', payableAmount: 2000, customProfit: 300 },
    ];
    const result = calculateVendorAnalytics(items, {
      amountField: 'payableAmount',
      profitField: 'customProfit',
    });
    expect(result[0].totalAmount).toBe(3000);
    expect(result[0].totalProfit).toBe(500);
  });

  test('includes items array per vendor', () => {
    const result = calculateVendorAnalytics(items);
    const abc = result.find(v => v.vendor === 'ABC Transport');
    expect(abc.items).toHaveLength(3);
  });
});

describe('calculateMonthlyBreakdown', () => {
  const items = [
    { invoiceDate: '2026-01-15', amount: 1000 },
    { invoiceDate: '2026-01-20', amount: 2000 },
    { invoiceDate: '2026-02-10', amount: 3000 },
    { invoiceDate: '2026-02-25', amount: 4000 },
    { invoiceDate: '2026-03-01', amount: 500 },
  ];

  test('groups items by month', () => {
    const result = calculateMonthlyBreakdown(items);
    expect(Object.keys(result)).toHaveLength(3);
    expect(result['2026-01']).toBeTruthy();
    expect(result['2026-02']).toBeTruthy();
    expect(result['2026-03']).toBeTruthy();
  });

  test('calculates monthly totals', () => {
    const result = calculateMonthlyBreakdown(items);
    expect(result['2026-01'].totalAmount).toBe(3000);
    expect(result['2026-02'].totalAmount).toBe(7000);
    expect(result['2026-03'].totalAmount).toBe(500);
  });

  test('counts items per month', () => {
    const result = calculateMonthlyBreakdown(items);
    expect(result['2026-01'].count).toBe(2);
    expect(result['2026-02'].count).toBe(2);
    expect(result['2026-03'].count).toBe(1);
  });

  test('stores items per month', () => {
    const result = calculateMonthlyBreakdown(items);
    expect(result['2026-01'].items).toHaveLength(2);
  });

  test('uses custom date and amount fields', () => {
    const items = [
      { submittedAt: '2026-01-15', invoiceAmount: 5000 },
      { submittedAt: '2026-01-20', invoiceAmount: 3000 },
    ];
    const result = calculateMonthlyBreakdown(items, 'submittedAt', 'invoiceAmount');
    expect(result['2026-01'].totalAmount).toBe(8000);
  });

  test('handles non-array input', () => {
    expect(calculateMonthlyBreakdown(null)).toEqual({});
    expect(calculateMonthlyBreakdown(undefined)).toEqual({});
  });

  test('handles empty array', () => {
    expect(calculateMonthlyBreakdown([])).toEqual({});
  });

  test('skips items with missing dates', () => {
    const items = [
      { invoiceDate: '2026-01-15', amount: 1000 },
      { amount: 2000 }, // no date
      { invoiceDate: null, amount: 3000 },
    ];
    const result = calculateMonthlyBreakdown(items);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['2026-01'].totalAmount).toBe(1000);
  });

  test('skips items with invalid dates', () => {
    const items = [
      { invoiceDate: 'not-a-date', amount: 1000 },
      { invoiceDate: '2026-01-15', amount: 2000 },
    ];
    const result = calculateMonthlyBreakdown(items);
    expect(Object.keys(result)).toHaveLength(1);
    expect(result['2026-01'].totalAmount).toBe(2000);
  });

  test('pads single-digit months', () => {
    const items = [{ invoiceDate: '2026-03-01', amount: 100 }];
    const result = calculateMonthlyBreakdown(items);
    expect(result['2026-03']).toBeTruthy(); // "03" not "3"
    expect(result['2026-3']).toBeUndefined();
  });
});
