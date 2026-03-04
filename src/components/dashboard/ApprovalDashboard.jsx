import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApprovalWorkflow } from '../../hooks';
import { Card, Button, Badge, StatusBadge, DataTable, FormModal, TextArea } from '../common';
import { StatCard, StatCardGrid } from '../common/StatCard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { MODULE_CONFIG, ROLES, PAYMENT_MODES } from '../../utils/constants';
import { getInvoiceFileUrl } from '../../services/fileUploadService';

/**
 * ApprovalDashboard - Payment-mode-based approval queue
 * Cashfree approver (Anush): sees only Cashfree entries
 * IDFC approver (Ramesh): sees only IDFC Bank entries
 * Accounts: can upload for payment and mark as paid
 * Admin: full access
 */
const ApprovalDashboard = () => {
  const { hasRole } = useAuth();
  const {
    myPendingQueue,
    pendingApprovalEntries,
    awaitingPaymentEntries,
    uploadedForPaymentEntries,
    paymentDoneEntries,
    rejectedEntries,
    onHoldEntries,
    handleApprove,
    handleReject,
    handleMarkPaid,
    handleUploadForPayment,
    handlePutOnHold,
    canApprove,
    canUploadForPayment,
    canMarkPaid,
    stats,
    getStatusLabel,
  } = useApprovalWorkflow();

  // Default tab based on role
  const getDefaultTab = () => {
    if (hasRole([ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER])) return 'pending';
    return 'awaiting_payment';
  };

  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(getDefaultTab());
  const [selectedPaymentModeFilter, setSelectedPaymentModeFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);
  const [actionModal, setActionModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Filter entries based on selection
  const filteredEntries = useMemo(() => {
    let entries = [];

    if (selectedStatus === 'pending') {
      // Use myPendingQueue for approvers (already filtered by role)
      entries = hasRole([ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER])
        ? myPendingQueue
        : pendingApprovalEntries;
    } else if (selectedStatus === 'awaiting_payment') {
      entries = awaitingPaymentEntries;
    } else if (selectedStatus === 'uploaded') {
      entries = uploadedForPaymentEntries;
    } else if (selectedStatus === 'payment_done') {
      entries = paymentDoneEntries;
    } else if (selectedStatus === 'rejected') {
      entries = rejectedEntries;
    } else if (selectedStatus === 'on_hold') {
      entries = onHoldEntries;
    }

    if (selectedModule !== 'all') {
      entries = entries.filter(e => e.module === selectedModule);
    }

    if (selectedPaymentModeFilter !== 'all') {
      entries = entries.filter(e => e.paymentMode === selectedPaymentModeFilter);
    }

    return entries;
  }, [selectedStatus, selectedModule, selectedPaymentModeFilter, myPendingQueue, pendingApprovalEntries, awaitingPaymentEntries, uploadedForPaymentEntries, paymentDoneEntries, rejectedEntries, onHoldEntries, hasRole]);

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
      render: (_, row) => {
        const invoiceCount = row.invoices?.length;
        return (
          <div>
            <span className="font-medium">{row.vendorName || row.customerId || row.driverName || row.particulars || '-'}</span>
            <span className="text-xs text-gray-500 block">{row.invoiceNumber || row.invoiceNo || row.city || '-'}</span>
            {invoiceCount > 1 && (
              <span className="text-xs text-primary-600 font-medium">{invoiceCount} invoices</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (_, row) => {
        const amount = row.invoiceAmount || row.payableAmount || row.refundAmount || row.amount || 0;
        const isRefund = row.module === 'refunds';
        return (
          <div>
            <span className={`font-medium ${isRefund ? 'text-danger-600' : 'text-success-600'}`}>
              {isRefund ? '-' : ''}{formatCurrency(amount)}
            </span>
            {row.tdsPercentage > 0 && (
              <span className="text-xs text-gray-500 block">
                TDS {row.tdsPercentage}% → Net {formatCurrency(row.netPayable)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'paymentMode',
      header: 'Payment Mode',
      render: (v) => v ? (
        <Badge variant={v === PAYMENT_MODES.CASHFREE ? 'primary' : 'success'} size="sm">
          {v}
        </Badge>
      ) : '-',
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (v) => v ? formatDate(v) : '-',
    },
    {
      key: 'date',
      header: 'Date',
      render: (_, row) => formatDate(row.invoiceDate || row.date || row.submittedAt),
    },
    {
      key: 'attachmentUrl',
      header: 'File',
      render: (v) => {
        if (!v) return <span className="text-gray-400 text-xs">No file</span>;
        const url = getInvoiceFileUrl(v);
        const isImage = /\.(jpe?g|png|webp|gif)$/i.test(v);
        return (
          <button
            type="button"
            onClick={() => setPreviewUrl(url)}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            {isImage ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            View
          </button>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => <StatusBadge status={getStatusLabel(row)} />,
    },
    // Show notes column for rejected entries
    ...(selectedStatus === 'rejected' ? [{
      key: 'notes',
      header: 'Rejection Notes',
      render: (v) => v || '-',
    }] : []),
  ];

  const handleProcessPayment = async () => {
    if (!paymentModal) return;

    setLoading(true);
    try {
      // Payment mode is already on the entry, use it directly
      const result = await handleMarkPaid(paymentModal.module, paymentModal.id, paymentModal.paymentMode);
      if (result === false) {
        showError('Failed to process payment. Please try again.');
        return;
      }
      setPaymentModal(null);
    } catch (err) {
      showError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRows.length === 0) return;

    setLoading(true);
    let failed = 0;
    try {
      for (const entry of filteredEntries.filter(e => selectedRows.includes(e.id))) {
        if (action === 'approve' && canApprove(entry)) {
          const result = await handleApprove(entry.module, entry.id, notes);
          if (!result) failed++;
        } else if (action === 'reject' && canApprove(entry)) {
          const result = await handleReject(entry.module, entry.id, notes);
          if (!result) failed++;
        }
      }
      if (failed > 0) {
        showError(`${failed} item(s) failed to ${action}. Others were processed.`);
      }
      setSelectedRows([]);
      setActionModal(null);
      setNotes('');
    } catch (err) {
      showError(`Bulk ${action} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const rowActions = (row) => {
    const showApproval = canApprove(row);
    const showUpload = canUploadForPayment(row);
    const showMarkPaid = canMarkPaid(row);

    return (
      <div className="flex gap-1">
        {showApproval && (
          <>
            <Button
              size="xs"
              variant="success"
              onClick={async () => {
                const result = await handleApprove(row.module, row.id);
                if (result === false) showError('Failed to approve entry. Please try again.');
              }}
            >
              Approve
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => {
                setRejectTarget({ module: row.module, id: row.id });
              }}
            >
              Reject
            </Button>
          </>
        )}
        {showUpload && (
          <Button
            size="xs"
            variant="primary"
            onClick={async () => {
              const result = await handleUploadForPayment(row.module, row.id);
              if (result === false) showError('Failed to upload for payment. Please try again.');
            }}
          >
            Upload to {row.paymentMode || 'Payment'}
          </Button>
        )}
        {showMarkPaid && (
          <Button
            size="xs"
            variant="success"
            onClick={() => setPaymentModal({ module: row.module, id: row.id, paymentMode: row.paymentMode })}
          >
            Mark Paid
          </Button>
        )}
      </div>
    );
  };

  // Dynamic title based on role
  const getDashboardTitle = () => {
    if (hasRole(ROLES.CASHFREE_APPROVER)) return 'Cashfree Approver';
    if (hasRole(ROLES.IDFC_APPROVER)) return 'IDFC Approver';
    if (hasRole(ROLES.ADMIN)) return 'Admin';
    return 'Accounts';
  };

  const canSelectRows = selectedStatus === 'pending' &&
    hasRole([ROLES.ADMIN, ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getDashboardTitle()} Approval Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Review and process pending approvals</p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-danger-500 hover:text-danger-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats */}
      <StatCardGrid columns={5}>
        <StatCard
          title="Pending"
          value={stats.pendingApproval}
          subtitle={formatCurrency(stats.pendingAmount)}
          color="warning"
          onClick={() => setSelectedStatus('pending')}
          active={selectedStatus === 'pending'}
        />
        <StatCard
          title="Awaiting Upload"
          value={stats.approved}
          subtitle={formatCurrency(stats.approvedAmount)}
          color="primary"
          onClick={() => setSelectedStatus('awaiting_payment')}
          active={selectedStatus === 'awaiting_payment'}
        />
        <StatCard
          title="Uploaded"
          value={stats.uploadedForPayment}
          subtitle={formatCurrency(stats.uploadedForPaymentAmount)}
          color="primary"
          onClick={() => setSelectedStatus('uploaded')}
          active={selectedStatus === 'uploaded'}
        />
        <StatCard
          title="Payment Done"
          value={stats.closed}
          subtitle={formatCurrency(stats.closedAmount)}
          color="success"
          onClick={() => setSelectedStatus('payment_done')}
          active={selectedStatus === 'payment_done'}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          subtitle={formatCurrency(stats.rejectedAmount)}
          color="danger"
          onClick={() => setSelectedStatus('rejected')}
          active={selectedStatus === 'rejected'}
        />
      </StatCardGrid>

      {/* Amount Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Pending Amount</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.totalPendingAmount)}</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Paid Amount</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPaidAmount)}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Modules</option>
            {Object.entries(MODULE_CONFIG).map(([key, config]) => (
              <option key={key} value={config.key}>{config.icon} {config.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="pending">Pending Approval</option>
            <option value="awaiting_payment">Awaiting Upload</option>
            <option value="uploaded">Uploaded for Payment</option>
            <option value="payment_done">Payment Done</option>
            <option value="on_hold">On Hold</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={selectedPaymentModeFilter}
            onChange={(e) => setSelectedPaymentModeFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Payment Modes</option>
            <option value={PAYMENT_MODES.IDFC_BANK}>IDFC Bank</option>
            <option value={PAYMENT_MODES.CASHFREE}>Cashfree</option>
          </select>

          {selectedRows.length > 0 && selectedStatus === 'pending' && canSelectRows && (
            <div className="flex items-center gap-2 sm:ml-auto">
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
        selectable={canSelectRows}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        emptyMessage={
          selectedStatus === 'pending'
            ? 'No items pending approval'
            : selectedStatus === 'awaiting_payment'
            ? 'No items awaiting upload'
            : selectedStatus === 'uploaded'
            ? 'No items uploaded for payment'
            : selectedStatus === 'payment_done'
            ? 'No completed payments'
            : selectedStatus === 'on_hold'
            ? 'No items on hold'
            : 'No rejected items'
        }
        paginate
        pageSize={25}
      />

      {/* Payment Confirmation Modal */}
      <FormModal
        isOpen={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        title="Confirm Payment Done"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPaymentModal(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleProcessPayment}
              loading={loading}
            >
              Confirm Payment Done
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Mark this entry as payment completed via <strong>{paymentModal?.paymentMode || 'selected mode'}</strong>?
        </p>
      </FormModal>

      {/* Reject Single Modal */}
      <FormModal
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setNotes(''); }}
        title="Reject Entry"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setRejectTarget(null); setNotes(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await handleReject(rejectTarget.module, rejectTarget.id, notes);
                  if (result === false) {
                    showError('Failed to reject entry. Please try again.');
                    return;
                  }
                  setRejectTarget(null);
                  setNotes('');
                } catch (err) {
                  showError('Failed to reject entry. Please try again.');
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

      {/* Attachment Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Attachment Preview</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewUrl(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 min-h-0">
              {/\.(jpe?g|png|webp|gif)/i.test(previewUrl) ? (
                <img
                  src={previewUrl}
                  alt="Invoice attachment"
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  title="Invoice attachment"
                  className="w-full rounded-lg border border-gray-200"
                  style={{ height: '75vh' }}
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
