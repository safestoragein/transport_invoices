import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { STATUS_VALUES, ROLES, PAYMENT_MODES } from '../utils/constants';

/**
 * Custom hook for 4-stage payment-mode-based approval workflow
 * Flow: PENDING_APPROVAL → READY_FOR_UPLOAD → UPLOADED_TO_BANK → PAYMENT_DONE
 * Routing: Cashfree invoices → Anush (CASHFREE_APPROVER)
 *          IDFC Bank invoices → Ramesh (IDFC_APPROVER)
 */
const useApprovalWorkflow = () => {
  const { hasRole } = useAuth();
  const { approveEntry, rejectEntry, markAsPaid, uploadForPayment, putOnHold, getAllEntries } = useData();

  // Helper: normalize legacy statuses
  const normalizeStatus = (status) => {
    if (status === 'pending' || status === 'awaiting_manager_approval' || status === 'awaiting_accounts_approval') return STATUS_VALUES.PENDING_APPROVAL;
    if (status === 'approved' || status === 'awaiting_payment') return STATUS_VALUES.READY_FOR_UPLOAD;
    if (status === 'uploaded_for_payment') return STATUS_VALUES.UPLOADED_TO_BANK;
    if (status === 'closed') return STATUS_VALUES.PAYMENT_DONE;
    return status;
  };

  const isPending = (entry) => normalizeStatus(entry.status) === STATUS_VALUES.PENDING_APPROVAL;
  const isReadyForUpload = (entry) => normalizeStatus(entry.status) === STATUS_VALUES.READY_FOR_UPLOAD;
  const isUploadedToBank = (entry) => normalizeStatus(entry.status) === STATUS_VALUES.UPLOADED_TO_BANK;
  const isPaymentDone = (entry) => normalizeStatus(entry.status) === STATUS_VALUES.PAYMENT_DONE;
  const isOnHold = (entry) => entry.status === STATUS_VALUES.ON_HOLD;
  const isRejected = (entry) => entry.status === STATUS_VALUES.REJECTED;

  // Backward compat aliases
  const isApproved = isReadyForUpload;
  const isUploadedForPayment = isUploadedToBank;

  const pendingApprovalEntries = useMemo(() => {
    return getAllEntries().filter(isPending);
  }, [getAllEntries]);

  const myPendingQueue = useMemo(() => {
    const pending = getAllEntries().filter(isPending);
    if (hasRole(ROLES.CASHFREE_APPROVER)) {
      return pending.filter(e => e.paymentMode === PAYMENT_MODES.CASHFREE);
    }
    if (hasRole(ROLES.IDFC_APPROVER)) {
      return pending.filter(e => e.paymentMode === PAYMENT_MODES.IDFC_BANK);
    }
    return pending;
  }, [getAllEntries, hasRole]);

  const awaitingPaymentEntries = useMemo(() => {
    return getAllEntries().filter(isReadyForUpload);
  }, [getAllEntries]);

  const approvedEntries = useMemo(() => {
    return getAllEntries().filter(
      (entry) => isReadyForUpload(entry) || isPaymentDone(entry) || isUploadedToBank(entry)
    );
  }, [getAllEntries]);

  const rejectedEntries = useMemo(() => {
    return getAllEntries().filter(isRejected);
  }, [getAllEntries]);

  const completedEntries = useMemo(() => {
    return getAllEntries().filter(isPaymentDone);
  }, [getAllEntries]);

  const uploadedForPaymentEntries = useMemo(() => {
    return getAllEntries().filter(isUploadedToBank);
  }, [getAllEntries]);

  const paymentDoneEntries = useMemo(() => {
    return getAllEntries().filter(isPaymentDone);
  }, [getAllEntries]);

  const onHoldEntries = useMemo(() => {
    return getAllEntries().filter(isOnHold);
  }, [getAllEntries]);

  /**
   * Check if user can approve an entry
   * CASHFREE → only CASHFREE_APPROVER (Anush)
   * IDFC → only IDFC_APPROVER (Ramesh)
   */
  const canApprove = useCallback(
    (entry) => {
      if (!entry || !isPending(entry)) return false;
      if (hasRole(ROLES.ADMIN)) return true;

      const mode = entry.paymentMode;
      if (mode === PAYMENT_MODES.CASHFREE) return hasRole(ROLES.CASHFREE_APPROVER);
      if (mode === PAYMENT_MODES.IDFC_BANK) return hasRole(ROLES.IDFC_APPROVER);
      return hasRole([ROLES.CASHFREE_APPROVER, ROLES.IDFC_APPROVER]);
    },
    [hasRole]
  );

  /**
   * Check if user can upload for payment
   * Only ACCOUNTS can: READY_FOR_UPLOAD → UPLOADED_TO_BANK
   */
  const canUploadForPayment = useCallback(
    (entry) => {
      if (!entry || !isReadyForUpload(entry)) return false;
      return hasRole([ROLES.ACCOUNTS, ROLES.ADMIN]);
    },
    [hasRole]
  );

  /**
   * Check if user can mark as paid
   * Only ACCOUNTS can: UPLOADED_TO_BANK → PAYMENT_DONE
   */
  const canMarkPaid = useCallback(
    (entry) => {
      if (!entry || !isUploadedToBank(entry)) return false;
      if (hasRole(ROLES.ADMIN)) return true;
      return hasRole(ROLES.ACCOUNTS);
    },
    [hasRole]
  );

  const getStatusLabel = useCallback((entry) => {
    if (!entry) return 'Unknown';
    if (isPending(entry)) return 'Pending Approval';
    if (isReadyForUpload(entry)) return 'Ready for Upload';
    if (isUploadedToBank(entry)) return 'Uploaded to Bank';
    if (isOnHold(entry)) return 'On Hold';
    if (isRejected(entry)) return 'Rejected';
    if (isPaymentDone(entry)) return `Payment Done${entry.paymentMode ? ` (${entry.paymentMode})` : ''}`;
    return 'Pending Approval';
  }, []);

  const getWorkflowStep = useCallback((entry) => {
    if (!entry) return 0;
    if (isPaymentDone(entry)) return 3;
    if (isUploadedToBank(entry)) return 2;
    if (isReadyForUpload(entry)) return 1;
    if (isRejected(entry)) return -1;
    if (isOnHold(entry)) return -2;
    return 0;
  }, []);

  const handleApprove = useCallback(
    async (module, id, notes = '') => approveEntry(module, id, notes),
    [approveEntry]
  );

  const handleReject = useCallback(
    async (module, id, notes = '') => rejectEntry(module, id, notes),
    [rejectEntry]
  );

  const handleMarkPaid = useCallback(
    async (module, id, paymentMode) => markAsPaid(module, id, paymentMode),
    [markAsPaid]
  );

  const handleUploadForPayment = useCallback(
    async (module, id) => uploadForPayment(module, id),
    [uploadForPayment]
  );

  const handlePutOnHold = useCallback(
    async (module, id, notes = '') => putOnHold(module, id, notes),
    [putOnHold]
  );

  const stats = useMemo(() => {
    const allEntries = getAllEntries();
    const getAmount = (e) => Number(e.finalPayable) || Number(e.netPayable) || Number(e.invoiceAmount) || Number(e.payableAmount) || Number(e.refundAmount) || Number(e.amount) || 0;
    const sumAmount = (entries) => entries.reduce((sum, e) => sum + getAmount(e), 0);

    const pending = allEntries.filter(isPending);
    const ready = allEntries.filter(isReadyForUpload);
    const uploaded = allEntries.filter(isUploadedToBank);
    const done = allEntries.filter(isPaymentDone);
    const rejected = allEntries.filter(isRejected);
    const onHold = allEntries.filter(isOnHold);

    return {
      total: allEntries.length,
      totalAmount: sumAmount(allEntries),
      pendingApproval: pending.length,
      pendingAmount: sumAmount(pending),
      // Backward compat
      approved: ready.length,
      approvedAmount: sumAmount(ready),
      readyForUpload: ready.length,
      readyForUploadAmount: sumAmount(ready),
      uploadedForPayment: uploaded.length,
      uploadedForPaymentAmount: sumAmount(uploaded),
      uploadedToBank: uploaded.length,
      uploadedToBankAmount: sumAmount(uploaded),
      closed: done.length,
      closedAmount: sumAmount(done),
      paymentDone: done.length,
      paymentDoneAmount: sumAmount(done),
      rejected: rejected.length,
      rejectedAmount: sumAmount(rejected),
      onHold: onHold.length,
      onHoldAmount: sumAmount(onHold),
      totalPendingAmount: sumAmount(pending) + sumAmount(ready) + sumAmount(uploaded),
      totalPaidAmount: sumAmount(done),
    };
  }, [getAllEntries]);

  return {
    // Entries by status
    pendingApprovalEntries,
    myPendingQueue,
    awaitingPaymentEntries,
    approvedEntries,
    rejectedEntries,
    completedEntries,
    uploadedForPaymentEntries,
    paymentDoneEntries,
    onHoldEntries,
    // Permission checks
    canApprove,
    canUploadForPayment,
    canMarkPaid,
    // Actions
    handleApprove,
    handleReject,
    handleMarkPaid,
    handleUploadForPayment,
    handlePutOnHold,
    // Utilities
    getStatusLabel,
    getWorkflowStep,
    isPending,
    isReadyForUpload,
    isApproved,
    isUploadedToBank,
    isUploadedForPayment,
    isPaymentDone,
    isOnHold,
    isRejected,
    stats,
  };
};

export default useApprovalWorkflow;
