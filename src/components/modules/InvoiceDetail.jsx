import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAudit } from '../../contexts/AuditContext';
import useApprovalWorkflow from '../../hooks/useApprovalWorkflow';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { calculatePaymentStatus } from '../../utils/calculations';
import { validatePaymentAmount } from '../../utils/validators';
import { PageHeader } from '../layout/MainLayout';
import { generateId } from '../../utils/calculations';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAllEntries, addPayment, billPayments } = useData();
  const { logs } = useAudit();
  const { getStatusLabel, getWorkflowStep, canApprove, canUploadForPayment, canMarkPaid,
          handleApprove, handleReject, handleUploadForPayment, handleMarkPaid } = useApprovalWorkflow();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({ paymentAmount: '', paymentReference: '', paymentDate: '', notes: '' });
  const [paymentError, setPaymentError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Find the bill
  const bill = useMemo(() => {
    const all = getAllEntries();
    return all.find(b => b.id === id);
  }, [getAllEntries, id]);

  // Get payments for this bill
  const payments = useMemo(() => {
    return billPayments.filter(p => p.billId === id);
  }, [billPayments, id]);

  // Get audit logs for this bill
  const auditLogs = useMemo(() => {
    return (logs || []).filter(log => log.recordId === id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, id]);

  // Calculate payment summary
  const paymentSummary = useMemo(() => {
    const finalPayable = Number(bill?.finalPayable) || Number(bill?.payableAmount) || Number(bill?.amount) || 0;
    return calculatePaymentStatus(finalPayable, payments);
  }, [bill, payments]);

  if (!bill) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Bill not found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:text-blue-800">Go Back</button>
      </div>
    );
  }

  const finalPayable = Number(bill.finalPayable) || Number(bill.payableAmount) || Number(bill.amount) || 0;
  const isTransport = bill.module === 'transport';
  const workflowStep = getWorkflowStep(bill);

  const handleAddPayment = async () => {
    setPaymentError('');
    const error = validatePaymentAmount(paymentData.paymentAmount, finalPayable, paymentSummary.totalPaid);
    if (error) { setPaymentError(error); return; }

    try {
      await addPayment(id, paymentData);
      setPaymentData({ paymentAmount: '', paymentReference: '', paymentDate: '', notes: '' });
      setShowPaymentForm(false);
    } catch (err) {
      setPaymentError(err.message);
    }
  };

  const statusColor = {
    0: 'bg-yellow-100 text-yellow-800',
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-indigo-100 text-indigo-800',
    3: 'bg-green-100 text-green-800',
    '-1': 'bg-red-100 text-red-800',
    '-2': 'bg-orange-100 text-orange-800',
  }[workflowStep] || 'bg-gray-100 text-gray-800';

  return (
    <div>
      <PageHeader
        title={`Invoice: ${bill.invoiceNumber || bill.invoiceNo || bill.id}`}
        subtitle={`${bill.vendorName || ''} - ${bill.module?.toUpperCase()}`}
        action={<button onClick={() => navigate(-1)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Back</button>}
      />

      {/* Status & Workflow Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>
              {getStatusLabel(bill)}
            </span>
            {bill.paymentMode && (
              <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">{bill.paymentMode}</span>
            )}
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              paymentSummary.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
              paymentSummary.paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {paymentSummary.paymentStatus}
            </span>
          </div>
          <div className="flex gap-2">
            {canApprove(bill) && (
              <>
                <button onClick={() => handleApprove(bill.module, bill.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Approve</button>
                <button onClick={() => handleReject(bill.module, bill.id, 'Rejected')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Reject</button>
              </>
            )}
            {canUploadForPayment(bill) && (
              <button onClick={() => handleUploadForPayment(bill.module, bill.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Upload to Bank</button>
            )}
            {canMarkPaid(bill) && (
              <button onClick={() => handleMarkPaid(bill.module, bill.id, bill.paymentMode)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Mark Paid</button>
            )}
          </div>
        </div>

        {/* Workflow Progress */}
        <div className="mt-4 flex items-center gap-1">
          {['Pending', 'Ready for Upload', 'Uploaded', 'Paid'].map((label, idx) => (
            <React.Fragment key={label}>
              <div className={`flex-1 h-2 rounded-full ${workflowStep >= idx ? 'bg-blue-600' : 'bg-gray-200'}`} />
              {idx < 3 && <div className="w-1" />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Pending</span><span>Ready</span><span>Uploaded</span><span>Paid</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {['details', 'payments', 'audit'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'details' ? 'Details & TDS' : tab === 'payments' ? `Payments (${payments.length})` : `Audit Log (${auditLogs.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Information</h3>
            <dl className="space-y-3">
              <DetailRow label="Vendor" value={bill.vendorName} />
              {bill.vendorNote && <DetailRow label="Note / Route" value={bill.vendorNote} />}
              <DetailRow label="Invoice Number" value={bill.invoiceNumber || bill.invoiceNo} />
              <DetailRow label="Invoice Date" value={formatDate(bill.invoiceDate)} />
              <DetailRow label="Month" value={bill.month} />
              <DetailRow label="City" value={bill.city} />
              <DetailRow label="Payment Mode" value={bill.paymentMode} />
              <DetailRow label="Due Date" value={formatDate(bill.dueDate)} />
              {bill.remarks && <DetailRow label="Remarks" value={bill.remarks} />}
              <DetailRow label="Submitted By" value={bill.submittedBy} />
              <DetailRow label="Created At" value={formatDateTime(bill.createdAt)} />
              {bill.approvedBy && <DetailRow label="Approved By" value={`${bill.approvedBy} on ${formatDateTime(bill.approvalTimestamp || bill.approvalDate)}`} />}
            </dl>
          </div>

          {/* Financial Summary with TDS Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
            <dl className="space-y-3">
              {isTransport ? (
                <>
                  <DetailRow label="Invoice Amount" value={formatCurrency(bill.invoiceAmount)} className="text-gray-900 font-medium" />
                  <DetailRow label="Received from Customer" value={formatCurrency(bill.receivedAmount)} className="text-green-700" />
                  <DetailRow label="Packing Material" value={formatCurrency(bill.packingMaterial)} className="text-orange-600" />

                  {/* TDS Breakdown */}
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">TDS Breakdown</h4>
                    <DetailRow label="TDS Applicable" value={bill.tdsApplicable ? 'Yes' : 'No'} />
                    {bill.tdsApplicable && (
                      <>
                        <DetailRow label="TDS Percentage" value={`${bill.tdsPercentage || 0}%`} />
                        <DetailRow label="TDS Amount" value={formatCurrency(bill.tdsAmount)} className="text-red-600" />
                        <DetailRow label="Amount After TDS" value={formatCurrency((Number(bill.invoiceAmount) || 0) - (Number(bill.tdsAmount) || 0))} />
                      </>
                    )}
                  </div>

                  {/* Penalty */}
                  <div className="border-t pt-3">
                    <DetailRow label="Penalty" value={formatCurrency(bill.penaltyAmount || 0)} className={Number(bill.penaltyAmount) > 0 ? 'text-red-600 font-medium' : ''} />
                  </div>

                  {/* Final Payable */}
                  <div className="border-t pt-3">
                    <DetailRow label="Final Payable" value={formatCurrency(bill.finalPayable)} className="text-lg font-bold text-gray-900" />
                  </div>

                  {/* Payment Status */}
                  <div className="border-t pt-3">
                    <DetailRow label="Total Paid" value={formatCurrency(paymentSummary.totalPaid)} className="text-green-700 font-medium" />
                    <DetailRow label="Remaining Balance" value={formatCurrency(paymentSummary.remainingBalance)} className={paymentSummary.remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'} />
                  </div>

                  {/* Profit/Loss */}
                  <div className="border-t pt-3">
                    <DetailRow
                      label="Profit / Loss"
                      value={formatCurrency(Math.abs(bill.profitLoss || 0))}
                      className={`text-lg font-bold ${(bill.profitLoss || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}
                      prefix={(bill.profitLoss || 0) >= 0 ? '+' : '-'}
                    />
                  </div>
                </>
              ) : (
                <>
                  <DetailRow label="Payable Amount" value={formatCurrency(bill.payableAmount || bill.amount)} className="text-lg font-bold text-gray-900" />
                  {Number(bill.tdsPercentage) > 0 && (
                    <>
                      <DetailRow label="TDS %" value={`${bill.tdsPercentage}%`} />
                      <DetailRow label="TDS Amount" value={formatCurrency(bill.tdsAmount)} className="text-red-600" />
                      <DetailRow label="Net Payable" value={formatCurrency(bill.netPayable || bill.finalPayable)} className="font-medium" />
                    </>
                  )}
                  <div className="border-t pt-3">
                    <DetailRow label="Total Paid" value={formatCurrency(paymentSummary.totalPaid)} className="text-green-700" />
                    <DetailRow label="Remaining" value={formatCurrency(paymentSummary.remainingBalance)} />
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm border">
          {/* Payment Summary Cards */}
          <div className="grid grid-cols-3 gap-4 p-6 border-b">
            <SummaryCard label="Final Payable" value={formatCurrency(finalPayable)} color="blue" />
            <SummaryCard label="Total Paid" value={formatCurrency(paymentSummary.totalPaid)} color="green" />
            <SummaryCard label="Remaining" value={formatCurrency(paymentSummary.remainingBalance)} color={paymentSummary.remainingBalance > 0 ? 'red' : 'green'} />
          </div>

          {/* Add Payment Button */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Payment History</h3>
            {paymentSummary.remainingBalance > 0 && (
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                + Add Payment
              </button>
            )}
          </div>

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="p-4 bg-blue-50 border-b">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={paymentData.paymentAmount}
                    onChange={e => setPaymentData({ ...paymentData, paymentAmount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder={`Max: ${paymentSummary.remainingBalance}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    value={paymentData.paymentReference}
                    onChange={e => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Transaction ID / UTR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={paymentData.notes}
                    onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              {paymentError && <p className="mt-2 text-sm text-red-600">{paymentError}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={handleAddPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Save Payment</button>
                <button onClick={() => { setShowPaymentForm(false); setPaymentError(''); }} className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          )}

          {/* Payment List */}
          <div className="divide-y">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No payments recorded yet</div>
            ) : (
              payments.map(payment => (
                <div key={payment.paymentId} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{formatCurrency(payment.paymentAmount)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(payment.paymentDate)} by {payment.createdBy}
                    </p>
                    {payment.paymentReference && (
                      <p className="text-xs text-gray-400">Ref: {payment.paymentReference}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Paid</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Audit Trail</h3>
          </div>
          <div className="divide-y">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No audit records found</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                      log.action === 'APPROVE' ? 'bg-green-100 text-green-700' :
                      log.action === 'REJECT' ? 'bg-red-100 text-red-700' :
                      log.action === 'ADD_PAYMENT' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{log.username}</span>
                    <span className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</span>
                  </div>
                  {log.details && <p className="text-sm text-gray-600">{log.details}</p>}
                  {log.changes && Array.isArray(log.changes) && log.changes.length > 0 && (
                    <div className="mt-2 text-xs space-y-1">
                      {log.changes.map((change, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-gray-500 font-medium">{change.field}:</span>
                          <span className="text-red-500 line-through">{String(change.from || '-')}</span>
                          <span className="text-gray-400">&rarr;</span>
                          <span className="text-green-600">{String(change.to || '-')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value, className = '', prefix = '' }) => (
  <div className="flex justify-between items-center">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className={`text-sm ${className}`}>{prefix}{value || '-'}</dd>
  </div>
);

const SummaryCard = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`p-4 rounded-lg border ${colors[color] || colors.blue}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
};

export default InvoiceDetail;
