import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardHeader } from '../common';
import { StatCard, StatCardGrid } from '../common/StatCard';
import { formatCurrency } from '../../utils/formatters';
import { calculateModuleStats, calculateApprovalStats } from '../../utils/calculations';
import { MODULE_CONFIG } from '../../utils/constants';

/**
 * WeeklySummary - Dashboard showing totals per module and status breakdown
 */
const WeeklySummary = () => {
  const {
    transportInvoices,
    generalBills,
    packingMaterials,
    pettyCash,
    happyCard,
    refunds,
    driveTrackPorter,
    reviews,
    getAllEntries,
  } = useData();

  // Calculate stats for each module
  const moduleStats = useMemo(() => ({
    transport: calculateModuleStats(transportInvoices, 'invoiceAmount'),
    general: calculateModuleStats(generalBills, 'payableAmount'),
    packing: calculateModuleStats(packingMaterials, 'payableAmount'),
    petty: calculateModuleStats(pettyCash, 'amount'),
    happy: calculateModuleStats(happyCard, 'payableAmount'),
    refunds: calculateModuleStats(refunds, 'refundAmount'),
    drive: calculateModuleStats(driveTrackPorter, 'amount'),
    reviews: calculateModuleStats(reviews, 'amount'),
  }), [transportInvoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  // Calculate P/L for transport
  const transportPL = useMemo(() =>
    transportInvoices.reduce((sum, inv) => sum + (inv.profitLoss || 0), 0),
    [transportInvoices]
  );

  // Calculate overall approval stats
  const approvalStats = useMemo(() => calculateApprovalStats(getAllEntries()), [getAllEntries]);

  // Calculate grand totals
  const grandTotal = useMemo(() => {
    const total = Object.values(moduleStats).reduce((sum, stat) => sum + stat.totalAmount, 0);
    return total - moduleStats.refunds.totalAmount; // Subtract refunds
  }, [moduleStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all modules and approval status</p>
      </div>

      {/* Grand Totals */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Total Entries"
          value={approvalStats.total}
          color="primary"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>}
        />
        <StatCard
          title="Net Amount"
          value={grandTotal}
          isCurrency
          color="neutral"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>}
        />
        <StatCard
          title="Transport P/L"
          value={transportPL}
          isCurrency
          color={transportPL >= 0 ? 'success' : 'danger'}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>}
        />
        <StatCard
          title="Pending Approval"
          value={approvalStats.pendingApproval}
          color="warning"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
      </StatCardGrid>

      {/* Approval Status */}
      <Card>
        <CardHeader title="Approval Pipeline" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{approvalStats.pendingApproval}</p>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{approvalStats.awaitingPayment}</p>
            <p className="text-sm text-gray-600">Awaiting Payment</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{approvalStats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{approvalStats.rejected}</p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>
      </Card>

      {/* Module Breakdown */}
      <Card>
        <CardHeader title="Module Summary" />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Module</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Entries</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Pending</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Completed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(MODULE_CONFIG).map(([key, config]) => {
                const stats = moduleStats[config.key];
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="font-medium">{config.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{stats?.count || 0}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {config.key === 'refunds' ? (
                        <span className="text-danger-600">-{formatCurrency(stats?.totalAmount)}</span>
                      ) : (
                        formatCurrency(stats?.totalAmount)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {stats?.pendingCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {stats?.approvedCount || 0}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{approvalStats.total}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(grandTotal)}</td>
                <td className="px-4 py-3 text-right">{approvalStats.pendingApproval}</td>
                <td className="px-4 py-3 text-right">{approvalStats.completed}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default WeeklySummary;
