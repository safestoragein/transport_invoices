import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApprovalWorkflow } from '../../hooks';
import { Card, CardHeader, Button, Badge, StatusBadge, DataTable, FormModal, TextArea } from '../common';
import { StatCard, StatCardGrid } from '../common/StatCard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { MODULE_CONFIG, ROLES, PAYMENT_MODES } from '../../utils/constants';

/**
 * ApprovalDashboard - Simplified approval queue
 * Admin: Approve/Reject pending entries
 * Accounts: Process payment on approved entries (select Bank/Cashfree)
 */
const ApprovalDashboard = () => {
  const { user, hasRole } = useAuth();
  const {
    pendingApprovalEntries,
    awaitingPaymentEntries,
    completedEntries,
    handleApprove,
    handleReject,
    handleMarkPaid,
    canApprove,
    canMarkPaid,
    stats,
    getStatusLabel,
  } = useApprovalWorkflow();

  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(
    hasRole(ROLES.ADMIN) ? 'pending' : 'awaiting_payment'
  );
  const [selectedRows, setSelectedRows] = useState([]);
  const [actionModal, setActionModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null); // { module, id } for single payment
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter entries based on selection
  const filteredEntries = useMemo(() => {
    let entries = [];

    if (selectedStatus === 'pending') {
      entries = pendingApprovalEntries;
    } else if (selectedStatus === 'awaiting_payment') {
      entries = awaitingPaymentEntries;
    } else if (selectedStatus === 'completed') {
      entries = completedEntries;
    }

    if (selectedModule !== 'all') {
      entries = entries.filter(e => e.module === selectedModule);
    }

    return entries;
  }, [selectedStatus, selectedModule, pendingApprovalEntries, awaitingPaymentEntries, completedEntries]);

  // Calculate filtered total
  const filteredTotal = useMemo(() =>
    filteredEntries.reduce((sum, e) => {
      const amount = e.invoiceAmount || e.payableAmount || e.refundAmount || e.amount || 0;
      return sum + amount;
    }, 0),
    [filteredEntries]
  );

  const getModuleLabel = (module) => MODULE_CONFIG[module]?.label || module;

  const columns = [
    {
      key: 'module',
      header: 'Type',
      render: (v) => (
        <Badge variant="primary" size="sm">
          {MODULE_CONFIG[v]?.icon} {getModuleLabel(v)}
        </Badge>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (_, row) => (
        <div>
          <span className="font-medium">{row.vendorName || row.customerId || row.driverName || row.particulars || '-'}</span>
          <span className="text-xs text-gray-500 block">{row.invoiceNumber || row.invoiceNo || row.city || '-'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (_, row) => {
        const amount = row.invoiceAmount || row.payableAmount || row.refundAmount || row.amount || 0;
        const isRefund = row.module === 'refunds';
        return (
          <span className={`font-medium ${isRefund ? 'text-danger-600' : 'text-success-600'}`}>
            {isRefund ? '-' : ''}{formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (_, row) => formatDate(row.invoiceDate || row.date || row.submittedAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => <StatusBadge status={getStatusLabel(row)} />,
    },
    // Show payment mode column for completed entries
    ...(selectedStatus === 'completed' ? [{
      key: 'paymentMode',
      header: 'Payment Mode',
      render: (v) => v ? (
        <Badge variant={v === PAYMENT_MODES.CASHFREE ? 'primary' : 'success'} size="sm">
          {v}
        </Badge>
      ) : '-',
    }] : []),
  ];

  const handleProcessPayment = async () => {
    if (!paymentModal || !selectedPaymentMode) return;

    setLoading(true);
    try {
      await handleMarkPaid(paymentModal.module, paymentModal.id, selectedPaymentMode);
      setPaymentModal(null);
      setSelectedPaymentMode('');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0) return;

    setLoading(true);
    try {
      for (const entry of filteredEntries.filter(e => selectedRows.includes(e.id))) {
        if (action === 'approve' && canApprove(entry)) {
          await handleApprove(entry.module, entry.id, notes);
        } else if (action === 'reject' && canApprove(entry)) {
          await handleReject(entry.module, entry.id, notes);
        }
      }
      setSelectedRows([]);
      setActionModal(null);
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  const rowActions = (row) => {
    const showApproval = canApprove(row);
    const showProcessPayment = canMarkPaid(row);

    return (
      <div className="flex gap-1">
        {showApproval && (
          <>
            <Button
              size="xs"
              variant="success"
              onClick={() => handleApprove(row.module, row.id)}
            >
              Approve
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => {
                setActionModal('reject_single');
                setPaymentModal({ module: row.module, id: row.id });
              }}
            >
              Reject
            </Button>
          </>
        )}
        {showProcessPayment && (
          <Button
            size="xs"
            variant="primary"
            onClick={() => setPaymentModal({ module: row.module, id: row.id })}
          >
            Process Payment
          </Button>
        )}
      </div>
    );
  };

  const dashboardTitle = hasRole(ROLES.ADMIN) ? 'Admin' : 'Accounts';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{dashboardTitle} Approval Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process pending approvals</p>
      </div>

      {/* Stats */}
      <StatCardGrid columns={4}>
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          color="warning"
        />
        <StatCard
          title="Awaiting Payment"
          value={stats.approved}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={stats.closed}
          color="success"
        />
        <StatCard
          title="Filtered Total"
          value={filteredTotal}
          isCurrency
          color="neutral"
        />
      </StatCardGrid>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Modules</option>
            {Object.entries(MODULE_CONFIG).map(([key, config]) => (
              <option key={key} value={config.key}>{config.icon} {config.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {hasRole(ROLES.ADMIN) && (
              <option value="pending">Pending Approval</option>
            )}
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="completed">Completed</option>
          </select>

          {selectedRows.length > 0 && selectedStatus === 'pending' && hasRole(ROLES.ADMIN) && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">{selectedRows.length} selected</span>
              <Button size="sm" variant="success" onClick={() => setActionModal('approve')}>
                Bulk Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setActionModal('reject')}>
                Bulk Reject
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <DataTable
        data={filteredEntries}
        columns={columns}
        rowActions={rowActions}
        selectable={selectedStatus === 'pending' && hasRole(ROLES.ADMIN)}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        emptyMessage={
          selectedStatus === 'pending'
            ? 'No items pending approval'
            : selectedStatus === 'awaiting_payment'
            ? 'No items awaiting payment'
            : 'No completed items'
        }
        paginate
        pageSize={25}
      />

      {/* Payment Mode Modal */}
      <FormModal
        isOpen={!!paymentModal && actionModal !== 'reject_single'}
        onClose={() => { setPaymentModal(null); setSelectedPaymentMode(''); }}
        title="Process Payment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setPaymentModal(null); setSelectedPaymentMode(''); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleProcessPayment}
              loading={loading}
              disabled={!selectedPaymentMode}
            >
              Confirm Payment
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Select the payment mode to close this entry.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSelectedPaymentMode(PAYMENT_MODES.BANK)}
            className={`flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors ${
              selectedPaymentMode === PAYMENT_MODES.BANK
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            Bank
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaymentMode(PAYMENT_MODES.CASHFREE)}
            className={`flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors ${
              selectedPaymentMode === PAYMENT_MODES.CASHFREE
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            Cashfree
          </button>
        </div>
      </FormModal>

      {/* Reject Single Modal */}
      <FormModal
        isOpen={actionModal === 'reject_single' && !!paymentModal}
        onClose={() => { setActionModal(null); setPaymentModal(null); setNotes(''); }}
        title="Reject Entry"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setActionModal(null); setPaymentModal(null); setNotes(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setLoading(true);
                try {
                  await handleReject(paymentModal.module, paymentModal.id, notes);
                  setActionModal(null);
                  setPaymentModal(null);
                  setNotes('');
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
            >
              Reject
            </Button>
          </div>
        }
      >
        <TextArea
          label="Rejection Notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for rejection..."
          rows={3}
        />
      </FormModal>

      {/* Bulk Action Modal */}
      <FormModal
        isOpen={actionModal === 'approve' || actionModal === 'reject'}
        onClose={() => { setActionModal(null); setNotes(''); }}
        title={actionModal === 'approve' ? 'Bulk Approve' : 'Bulk Reject'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setActionModal(null); setNotes(''); }}>
              Cancel
            </Button>
            <Button
              variant={actionModal === 'approve' ? 'success' : 'danger'}
              onClick={() => handleBulkAction(actionModal)}
              loading={loading}
            >
              {actionModal === 'approve' ? 'Approve All' : 'Reject All'} ({selectedRows.length})
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          You are about to {actionModal} {selectedRows.length} items.
        </p>
        <TextArea
          label="Notes (optional)"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          rows={3}
        />
      </FormModal>
    </div>
  );
};

export default ApprovalDashboard;
