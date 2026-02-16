import React, { useState, useMemo } from 'react';
import { useData } from '../../../contexts/DataContext';
import { useToast } from '../../../contexts/ToastContext';
import { useFilters, usePagination, useExcel } from '../../../hooks';
import { DataTable, Button, Badge, StatusBadge, FormModal, FilterBar, SearchInput, Card, CardHeader } from '../../common';
import { StatCard, StatCardGrid } from '../../common/StatCard';
import { HistoryModal } from '../../audit/HistoryPanel';
import TransportForm from './TransportForm';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateModuleStats, calculateVendorAnalytics } from '../../../utils/calculations';

/**
 * TransportList - List view for transport invoices
 */
const TransportList = () => {
  const { transportInvoices, createEntry, updateEntry, deleteEntry } = useData();
  const { success, error } = useToast();
  const { exportToExcel, exporting } = useExcel('transport');

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter configuration
  const filterConfig = [
    { name: 'search', type: 'text', label: 'Search', placeholder: 'Search vendor, invoice...' },
    { name: 'dateRange', type: 'dateRange', label: 'Date Range' },
    { name: 'amountRange', type: 'amountRange', label: 'Amount Range' },
    { name: 'vendor', type: 'select', label: 'Vendor', options: [] },
    { name: 'city', type: 'select', label: 'City', options: [] },
    { name: 'status', type: 'select', label: 'Status', options: [
      { value: 'pending', label: 'Pending' },
      { value: 'awaiting_accounts_approval', label: 'Awaiting Accounts' },
      { value: 'awaiting_payment', label: 'Awaiting Payment' },
      { value: 'closed', label: 'Closed' },
      { value: 'rejected', label: 'Rejected' },
    ]},
  ];

  // Use filters
  const {
    filters,
    filteredData,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    getUniqueValues,
  } = useFilters(transportInvoices, {
    moduleName: 'transport',
    searchFields: ['invoiceNumber', 'vendorName', 'city', 'remarks'],
    dateField: 'invoiceDate',
    amountField: 'invoiceAmount',
  });

  // Update filter options with unique values
  const filtersWithOptions = useMemo(() => {
    return filterConfig.map(f => {
      if (f.name === 'vendor') {
        return { ...f, options: getUniqueValues('vendorName').map(v => ({ value: v, label: v })) };
      }
      if (f.name === 'city') {
        return { ...f, options: getUniqueValues('city').map(v => ({ value: v, label: v })) };
      }
      return f;
    });
  }, [getUniqueValues]);

  // Calculate statistics
  const stats = useMemo(() => calculateModuleStats(filteredData, 'invoiceAmount'), [filteredData]);
  const totalPL = useMemo(() =>
    filteredData.reduce((sum, item) => sum + (item.profitLoss || 0), 0),
    [filteredData]
  );
  const totalCustomerPaid = useMemo(() =>
    filteredData.reduce((sum, item) => sum + (Number(item.receivedAmount) || 0), 0),
    [filteredData]
  );

  // Table columns
  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (value, row) => (
        <div>
          <span className="font-medium text-primary-600">{value || '-'}</span>
        </div>
      ),
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
    {
      key: 'invoiceDate',
      header: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'invoiceAmount',
      header: 'Invoice Amt',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'receivedAmount',
      header: 'Customer Paid',
      render: (value) => {
        const val = value || 0;
        return (
          <span className={val > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
            {formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'profitLoss',
      header: 'P/L',
      render: (value) => {
        const val = value || 0;
        return (
          <span className={val >= 0 ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
            {val >= 0 ? '+' : ''}{formatCurrency(val)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  // Handle form submission
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingItem) {
        updateEntry('transport', editingItem.id, data);
        success('Invoice updated successfully');
      } else {
        createEntry('transport', data);
        success('Invoice submitted successfully');
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = (item) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteEntry('transport', item.id);
      success('Invoice deleted successfully');
    }
  };

  // Row actions
  const rowActions = (row) => (
    <>
      <button
        onClick={() => setHistoryRecord(row)}
        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
        title="View History"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <button
        onClick={() => handleEdit(row)}
        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
        title="Edit"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={() => handleDelete(row)}
        className="p-1.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded"
        title="Delete"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transport Bills</h1>
          <p className="text-sm text-gray-500 mt-1">Manage transport invoices and track profit/loss</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => exportToExcel(filteredData)}
            loading={exporting}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>}
          >
            Export
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>}
          >
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatCardGrid columns={5}>
        <StatCard
          title="Total Invoices"
          value={stats.count}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>}
          color="primary"
        />
        <StatCard
          title="Invoice Amount"
          value={stats.totalAmount}
          isCurrency
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>}
          color="neutral"
        />
        <StatCard
          title="Customer Paid"
          value={totalCustomerPaid}
          isCurrency
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
          color="primary"
        />
        <StatCard
          title="Total P/L"
          value={totalPL}
          isCurrency
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>}
          color={totalPL >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Pending"
          value={stats.pendingCount}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
          color="warning"
        />
      </StatCardGrid>

      {/* Filters */}
      <FilterBar
        filters={filtersWithOptions}
        values={filters}
        onChange={(newFilters) => {
          Object.entries(newFilters).forEach(([key, value]) => {
            updateFilter(key, value);
          });
        }}
        onClear={clearFilters}
        collapsible
        defaultExpanded={hasActiveFilters}
      />

      {/* Data Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        rowActions={rowActions}
        emptyMessage="No transport invoices found"
        paginate
        sortable
      />

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Transport Invoice' : 'New Transport Invoice'}
        size="lg"
      >
        <TransportForm
          initialData={editingItem}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          loading={loading}
        />
      </FormModal>

      {/* History Panel */}
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
