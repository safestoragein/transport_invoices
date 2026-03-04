import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { calculateMonthlyBreakdown, calculateApprovalStats } from '../../utils/calculations';
import { formatCurrency, formatMonthYear } from '../../utils/formatters';
import { MODULE_CONFIG } from '../../utils/constants';
import { PageHeader } from '../layout/MainLayout';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { getAllEntries, billPayments, transportInvoices, generalBills, packingMaterials, pettyCash } = useData();
  const [activeTab, setActiveTab] = useState('settlement');

  const allEntries = useMemo(() => getAllEntries(), [getAllEntries]);

  // Monthly Settlement Summary
  const monthlySettlement = useMemo(() => {
    const breakdown = calculateMonthlyBreakdown(allEntries, 'invoiceDate', 'finalPayable');
    const months = Object.keys(breakdown).sort().reverse();

    return months.map(monthKey => {
      const data = breakdown[monthKey];
      const moduleBreakdown = {};

      data.items.forEach(item => {
        const mod = item.module || 'other';
        if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { count: 0, amount: 0 };
        moduleBreakdown[mod].count++;
        moduleBreakdown[mod].amount += Number(item.finalPayable) || Number(item.payableAmount) || Number(item.amount) || 0;
      });

      const stats = calculateApprovalStats(data.items);
      const totalPaid = data.items.reduce((sum, item) => {
        const itemPayments = billPayments.filter(p => p.billId === item.id);
        return sum + itemPayments.reduce((s, p) => s + (Number(p.paymentAmount) || 0), 0);
      }, 0);

      return {
        month: monthKey,
        totalAmount: data.totalAmount,
        count: data.count,
        moduleBreakdown,
        stats,
        totalPaid,
        outstanding: data.totalAmount - totalPaid,
      };
    });
  }, [allEntries, billPayments]);

  // Cashflow Dashboard data
  const cashflowData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    return months.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthItems = allEntries.filter(item => {
        const date = new Date(item.invoiceDate);
        return !isNaN(date.getTime()) && date.getFullYear() === parseInt(year) && (date.getMonth() + 1) === parseInt(month);
      });

      const inflow = monthItems.reduce((sum, item) => sum + (Number(item.receivedAmount) || 0), 0);
      const outflow = monthItems.reduce((sum, item) => sum + (Number(item.finalPayable) || Number(item.payableAmount) || Number(item.amount) || 0), 0);
      const monthPayments = billPayments.filter(p => {
        const date = new Date(p.paymentDate);
        return !isNaN(date.getTime()) && date.getFullYear() === parseInt(year) && (date.getMonth() + 1) === parseInt(month);
      });
      const actualPaid = monthPayments.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

      return {
        month: monthKey,
        label: formatMonthYear(new Date(parseInt(year), parseInt(month) - 1)),
        inflow,
        outflow,
        actualPaid,
        net: inflow - outflow,
        count: monthItems.length,
      };
    });
  }, [allEntries, billPayments]);

  // Export functions
  const exportModule = (moduleName, data) => {
    if (!data || data.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
      const row = { ...item };
      delete row.invoices; // Remove JSONB fields
      return row;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, moduleName);
    XLSX.writeFile(wb, `${moduleName}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportAll = () => {
    const wb = XLSX.utils.book_new();
    const modules = { Transport: transportInvoices, General: generalBills, Packing: packingMaterials, 'Petty Cash': pettyCash };
    Object.entries(modules).forEach(([name, data]) => {
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.map(item => {
          const row = { ...item };
          delete row.invoices;
          return row;
        }));
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    });
    XLSX.writeFile(wb, `all_modules_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const maxOutflow = Math.max(...cashflowData.map(d => d.outflow), 1);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Monthly settlement, cashflow dashboard, and exports"
        action={
          <button onClick={exportAll} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            Export All Modules
          </button>
        }
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'settlement', label: 'Monthly Settlement' },
          { key: 'cashflow', label: 'Cashflow Dashboard' },
          { key: 'export', label: 'Excel Export' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
              activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Monthly Settlement */}
      {activeTab === 'settlement' && (
        <div className="space-y-4">
          {monthlySettlement.map(month => (
            <div key={month.month} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{formatMonthYear(new Date(month.month + '-01'))}</h3>
                  <p className="text-sm text-gray-500">{month.count} bills</p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-gray-500">Total Payable</p>
                    <p className="font-bold text-gray-900">{formatCurrency(month.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-bold text-green-600">{formatCurrency(month.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Outstanding</p>
                    <p className={`font-bold ${month.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(month.outstanding))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Module Breakdown */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(month.moduleBreakdown).map(([mod, data]) => {
                    const config = MODULE_CONFIG[mod];
                    return (
                      <div key={mod} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 capitalize">{config?.label || mod}</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(data.amount)}</p>
                        <p className="text-xs text-gray-400">{data.count} bills</p>
                      </div>
                    );
                  })}
                </div>

                {/* Status breakdown */}
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="text-yellow-600">Pending: {month.stats.pendingApproval}</span>
                  <span className="text-blue-600">Ready: {month.stats.readyForUpload}</span>
                  <span className="text-indigo-600">Uploaded: {month.stats.uploadedToBank}</span>
                  <span className="text-green-600">Completed: {month.stats.completed}</span>
                  <span className="text-red-600">Rejected: {month.stats.rejected}</span>
                </div>
              </div>
            </div>
          ))}
          {monthlySettlement.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">No data available</div>
          )}
        </div>
      )}

      {/* Cashflow Dashboard */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs font-medium text-gray-500">Total Inflow (6mo)</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(cashflowData.reduce((s, d) => s + d.inflow, 0))}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs font-medium text-gray-500">Total Outflow (6mo)</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(cashflowData.reduce((s, d) => s + d.outflow, 0))}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs font-medium text-gray-500">Actually Paid (6mo)</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(cashflowData.reduce((s, d) => s + d.actualPaid, 0))}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-xs font-medium text-gray-500">Net Position (6mo)</p>
              {(() => {
                const net = cashflowData.reduce((s, d) => s + d.net, 0);
                return <p className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(net))}</p>;
              })()}
            </div>
          </div>

          {/* Bar Chart (CSS-based) */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Monthly Cashflow (Last 6 Months)</h3>
            <div className="space-y-4">
              {cashflowData.map(month => (
                <div key={month.month} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600 text-right flex-shrink-0">{month.label}</div>
                  <div className="flex-1 space-y-1">
                    {/* Outflow bar */}
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-red-400 rounded-r" style={{ width: `${(month.outflow / maxOutflow) * 100}%`, minWidth: month.outflow > 0 ? '4px' : '0' }} />
                      <span className="text-xs text-red-600">{formatCurrency(month.outflow)}</span>
                    </div>
                    {/* Paid bar */}
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-green-400 rounded-r" style={{ width: `${(month.actualPaid / maxOutflow) * 100}%`, minWidth: month.actualPaid > 0 ? '4px' : '0' }} />
                      <span className="text-xs text-green-600">{formatCurrency(month.actualPaid)}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-xs text-gray-400">{month.count} bills</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" /> Payable</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> Paid</span>
            </div>
          </div>
        </div>
      )}

      {/* Excel Export */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(MODULE_CONFIG).map(([key, config]) => {
            const moduleData = allEntries.filter(e => e.module === key);
            return (
              <div key={key} className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <p className="text-3xl mb-2">{config.icon}</p>
                <h4 className="font-semibold text-gray-900">{config.label}</h4>
                <p className="text-sm text-gray-500 mb-4">{moduleData.length} records</p>
                <button
                  onClick={() => exportModule(config.label, moduleData)}
                  disabled={moduleData.length === 0}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    moduleData.length > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Download Excel
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;
