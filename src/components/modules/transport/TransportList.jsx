import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { useFilters, usePagination, useExcel } from '../../../hooks';
import { DataTable, Button, Badge, StatusBadge, FormModal, FilterBar, SearchInput, Card, CardHeader } from '../../common';
import { ApprovalBadge } from '../../common/Badge';
import { StatCard, StatCardGrid } from '../../common/StatCard';
import { HistoryModal } from '../../audit/HistoryPanel';
import TransportForm from './TransportForm';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateModuleStats, calculateGroupTotals, calculatePaymentStatus } from '../../../utils/calculations';
import { canEditBill } from '../../../utils/validators';

const TransportList = () => {
  const { transportInvoices, transportGroups, billPayments, createEntry, updateEntry, deleteEntry, createTransportGroup, assignToGroup } = useData();
  const { success, error } = useToast();
  const { exportToExcel, exporting } = useExcel('transport');
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'weekly'
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupVendor, setNewGroupVendor] = useState('');

  const filterConfig = [
    { name: 'search', type: 'text', label: 'Search', placeholder: 'Search vendor, invoice...' },
    { name: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { name: 'amountRange', type: 'amountRange', label: 'Amount Range' },
    { name: 'vendor', type: 'select', label: 'Vendor', options: [] },
    { name: 'city', type: 'select', label: 'City', options: [] },
    { name: 'paymentMode', type: 'select', label: 'Payment Mode', options: [
      { value: 'IDFC Bank', label: 'IDFC Bank' },
      { value: 'Cashfree', label: 'Cashfree' },
    ]},
    { name: 'status', type: 'select', label: 'Status', options: [
      { value: 'pending_approval', label: 'Pending Approval' },
      { value: 'ready_for_upload', label: 'Ready for Upload' },
      { value: 'uploaded_to_bank', label: 'Uploaded' },
      { value: 'payment_done', label: 'Payment Done' },
      { value: 'rejected', label: 'Rejected' },
    ]},
  ];

  const {
    filters, filteredData, updateFilter, clearFilters, hasActiveFilters, getUniqueValues,
  } = useFilters(transportInvoices, {
    moduleName: 'transport',
    searchFields: ['invoiceNumber', 'vendorName', 'city', 'remarks'],
    dateField: 'invoiceDate',
    amountField: 'finalPayable',
  });

  const filtersWithOptions = useMemo(() => {
    return filterConfig.map(f => {
      if (f.name === 'vendor') return { ...f, options: getUniqueValues('vendorName').map(v => ({ value: v, label: v })) };
      if (f.name === 'city') return { ...f, options: getUniqueValues('city').map(v => ({ value: v, label: v })) };
      return f;
    });
  }, [getUniqueValues]);

  // Stats
  const stats = useMemo(() => calculateModuleStats(filteredData, 'finalPayable'), [filteredData]);
  const totalPL = useMemo(() => filteredData.reduce((sum, item) => sum + (Number(item.profitLoss) || 0), 0), [filteredData]);
  const totalFinalPayable = useMemo(() => filteredData.reduce((sum, item) => sum + (Number(item.finalPayable) || 0), 0), [filteredData]);

  // Payment totals from bill_payments
  const totalPaid = useMemo(() => {
    return filteredData.reduce((sum, item) => {
      const payments = billPayments.filter(p => p.billId === item.id);
      return sum + payments.reduce((s, p) => s + (Number(p.paymentAmount) || 0), 0);
    }, 0);
  }, [filteredData, billPayments]);

  const totalRemaining = totalFinalPayable - totalPaid;

  // Weekly group data
  const groupedData = useMemo(() => {
    if (!transportGroups || transportGroups.length === 0) return [];
    return transportGroups.map(group => {
      const invoices = transportInvoices.filter(inv => inv.weeklyGroupId === group.groupId);
      const totals = calculateGroupTotals(invoices);
      return { ...group, ...totals, invoices };
    });
  }, [transportGroups, transportInvoices]);

  // Helper to get payment status for a bill
  const getBillPaymentStatus = (bill) => {
    const payments = billPayments.filter(p => p.billId === bill.id);
    const fp = Number(bill.finalPayable) || Number(bill.payableAmount) || 0;
    return calculatePaymentStatus(fp, payments);
  };

  // Table columns - updated with Final Payable, Total Paid, Remaining
  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (value, row) => {
        const count = row.invoices?.length;
        return (
          <div>
            <button
              onClick={() => navigate(`/invoice/${row.id}`)}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {value || '-'}
            </button>
            {count > 1 && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                +{count - 1}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      render: (value, row) => (
        <div>
          <span className="font-medium">{value || '-'}</span>
          {row.city && <span className="text-xs text-gray-500 block">{row.city}</span>}
        </div>
      ),
    },
    { key: 'invoiceDate', header: 'Date', render: (value) => formatDate(value) },
    { key: 'invoiceAmount', header: 'Invoice Amt', render: (value) => formatCurrency(value) },
    {
      key: 'finalPayable',
      header: 'Final Payable',
      render: (value) => <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>,
    },
    {
      key: 'totalPaid',
      header: 'Total Paid',
      render: (_, row) => {
        const { totalPaid } = getBillPaymentStatus(row);
        return <span className={totalPaid > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>{formatCurrency(totalPaid)}</span>;
      },
    },
    {
      key: 'remainingBalance',
      header: 'Remaining',
      render: (_, row) => {
        const { remainingBalance } = getBillPaymentStatus(row);
        return <span className={remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatCurrency(remainingBalance)}</span>;
      },
    },
    {
      key: 'profitLoss',
      header: 'P/L',
      render: (value) => {
        const val = value || 0;
        return <span className={val >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{val >= 0 ? '+' : ''}{formatCurrency(val)}</span>;
      },
    },
    { key: 'paymentMode', header: 'Mode' },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const labels = {
          pending_approval: { text: 'Pending Approval', cls: 'bg-yellow-100 text-yellow-800' },
          ready_for_upload: { text: 'Ready for Upload', cls: 'bg-blue-100 text-blue-800' },
          uploaded_to_bank: { text: 'Uploaded', cls: 'bg-indigo-100 text-indigo-800' },
          payment_done: { text: 'Paid', cls: 'bg-green-100 text-green-800' },
          rejected: { text: 'Rejected', cls: 'bg-red-100 text-red-800' },
          on_hold: { text: 'On Hold', cls: 'bg-orange-100 text-orange-800' },
          // Legacy
          approved: { text: 'Ready for Upload', cls: 'bg-blue-100 text-blue-800' },
          uploaded_for_payment: { text: 'Uploaded', cls: 'bg-indigo-100 text-indigo-800' },
        };
        const label = labels[value] || { text: value || 'Pending', cls: 'bg-gray-100 text-gray-600' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${label.cls}`}>{label.text}</span>;
      },
    },
    {
      key: 'paymentStatusDerived',
      header: 'Payment',
      render: (_, row) => {
        const { paymentStatus } = getBillPaymentStatus(row);
        const cls = paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                    paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{paymentStatus}</span>;
      },
    },
  ];

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingItem) {
        const result = await updateEntry('transport', editingItem.id, data);
        if (!result) { error('Failed to update invoice'); return; }
        success('Invoice updated successfully');
      } else {
        const result = await createEntry('transport', data);
        if (!result) { error('Failed to save invoice'); return; }
        success('Invoice submitted successfully');
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      error(err.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    if (!canEditBill(item)) {
      error('Cannot edit a bill after payment is completed');
      return;
    }
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!canEditBill(item)) {
      error('Cannot delete a bill after payment is completed');
      return;
    }
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const result = await deleteEntry('transport', item.id);
        if (result) success('Invoice deleted'); else error('Failed to delete');
      } catch (err) {
        error(err.message || 'Failed to delete');
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName || !newGroupVendor) return;
    try {
      await createTransportGroup({ groupName: newGroupName, vendorName: newGroupVendor });
      setShowGroupForm(false);
      setNewGroupName('');
      setNewGroupVendor('');
      success('Group created');
    } catch (err) {
      error(err.message || 'Failed to create group');
    }
  };

  const rowActions = (row) => (
    <>
      <button onClick={() => navigate(`/invoice/${row.id}`)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded" title="View Details">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
      <button onClick={() => handleEdit(row)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded" title="Edit">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-500 hover:text-red-600 rounded" title="Delete">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport Bills</h1>
          <p className="text-sm text-gray-500 mt-1">Manage transport invoices and track profit/loss</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'individual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Individual
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Weekly Groups
            </button>
          </div>
          <Button variant="secondary" onClick={() => exportToExcel(filteredData)} loading={exporting}>Export</Button>
          <Button variant="primary" onClick={() => setShowForm(true)}>+ New Invoice</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 font-medium">Invoices</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{stats.count}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 font-medium">Final Payable</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalFinalPayable)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 font-medium">Total Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 font-medium">Remaining</p>
          <p className={`text-xl font-bold mt-1 ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs text-gray-500 font-medium">Total P/L</p>
          <p className={`text-xl font-bold mt-1 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}</p>
        </div>
      </div>

      {/* Individual View */}
      {viewMode === 'individual' && (
        <>
          <FilterBar
            filters={filtersWithOptions}
            values={filters}
            onChange={(newFilters) => Object.entries(newFilters).forEach(([key, value]) => updateFilter(key, value))}
            onClear={clearFilters}
            collapsible
            defaultExpanded={hasActiveFilters}
          />
          <DataTable
            data={filteredData}
            columns={columns}
            rowActions={rowActions}
            emptyMessage="No transport invoices found"
            paginate
            sortable
          />
        </>
      )}

      {/* Weekly Group View */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Groups</h2>
            <Button variant="primary" onClick={() => setShowGroupForm(true)}>+ New Group</Button>
          </div>

          {showGroupForm && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Group Name" className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text" value={newGroupVendor} onChange={e => setNewGroupVendor(e.target.value)}
                  placeholder="Vendor Name" className="px-3 py-2 border rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleCreateGroup}>Create</Button>
                  <Button variant="secondary" onClick={() => setShowGroupForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {groupedData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
              No weekly groups created yet. Create a group and assign invoices to it.
            </div>
          ) : (
            groupedData.map(group => (
              <div key={group.groupId} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.groupName}</h3>
                      <p className="text-sm text-gray-500">{group.vendorName} - {group.count} invoices</p>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-xs text-gray-500">Total Received</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(group.totalReceived)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Final Payable</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(group.totalFinalPayable)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Profit</p>
                        <p className={`font-semibold ${group.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {group.totalProfit >= 0 ? '+' : ''}{formatCurrency(group.totalProfit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {group.invoices.length > 0 && (
                  <div className="divide-y">
                    {group.invoices.map(inv => (
                      <div key={inv.id} className="p-3 flex items-center justify-between text-sm hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <button onClick={() => navigate(`/invoice/${inv.id}`)} className="text-blue-600 hover:underline font-medium">
                            {inv.invoiceNumber || inv.id}
                          </button>
                          <span className="text-gray-500">{formatDate(inv.invoiceDate)}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span>{formatCurrency(inv.finalPayable)}</span>
                          <span className={inv.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {inv.profitLoss >= 0 ? '+' : ''}{formatCurrency(inv.profitLoss)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Ungrouped invoices */}
          {(() => {
            const ungrouped = transportInvoices.filter(inv => !inv.weeklyGroupId);
            if (ungrouped.length === 0) return null;
            return (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 bg-yellow-50 border-b">
                  <h3 className="font-semibold text-gray-900">Ungrouped Invoices ({ungrouped.length})</h3>
                </div>
                <div className="divide-y">
                  {ungrouped.slice(0, 20).map(inv => (
                    <div key={inv.id} className="p-3 flex items-center justify-between text-sm hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/invoice/${inv.id}`)} className="text-blue-600 hover:underline font-medium">
                          {inv.invoiceNumber || inv.id}
                        </button>
                        <span className="text-gray-500">{inv.vendorName}</span>
                        <span className="text-gray-400">{formatDate(inv.invoiceDate)}</span>
                      </div>
                      <span>{formatCurrency(inv.finalPayable)}</span>
                    </div>
                  ))}
                  {ungrouped.length > 20 && (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      +{ungrouped.length - 20} more ungrouped invoices
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
        title={editingItem ? 'Edit Transport Invoice' : 'New Transport Invoice'}
        size="lg"
      >
        <TransportForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          loading={loading}
        />
      </FormModal>

      <HistoryModal
        isOpen={!!historyRecord}
        module="transport"
        recordId={historyRecord?.id}
        onClose={() => setHistoryRecord(null)}
      />
    </div>
  );
};

export default TransportList;
