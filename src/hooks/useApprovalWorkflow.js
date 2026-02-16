import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { STATUS_VALUES, ROLES } from '../utils/constants';

/**
 * Custom hook for simplified approval workflow
 * Flow: PENDING_APPROVAL → APPROVED → CLOSED (or REJECTED)
 */
const useApprovalWorkflow = () => {
  const { user, hasRole } = useAuth();
  const { approveEntry, rejectEntry, markAsPaid, getAllEntries } = useData();

  /**
   * Get all entries pending approval (admin sees these)
   */
  const pendingApprovalEntries = useMemo(() => {
    const allEntries = getAllEntries();
    return allEntries.filter(
      (entry) => entry.status === STATUS_VALUES.PENDING_APPROVAL
    );
  }, [getAllEntries]);

  /**
   * Get entries awaiting payment (approved but not yet closed)
   */
  const awaitingPaymentEntries = useMemo(() => {
    const allEntries = getAllEntries();
    return allEntries.filter(
      (entry) => entry.status === STATUS_VALUES.APPROVED
    );
  }, [getAllEntries]);

  /**
   * Get approved entries (includes awaiting payment)
   */
  const approvedEntries = useMemo(() => {
    const allEntries = getAllEntries();
    return allEntries.filter(
      (entry) =>
        entry.status === STATUS_VALUES.APPROVED ||
        entry.status === STATUS_VALUES.CLOSED
    );
  }, [getAllEntries]);

  /**
   * Get rejected entries
   */
  const rejectedEntries = useMemo(() => {
    const allEntries = getAllEntries();
    return allEntries.filter(
      (entry) => entry.status === STATUS_VALUES.REJECTED
    );
  }, [getAllEntries]);

  /**
   * Get completed (closed) entries
   */
  const completedEntries = useMemo(() => {
    const allEntries = getAllEntries();
    return allEntries.filter((entry) => entry.status === STATUS_VALUES.CLOSED);
  }, [getAllEntries]);

  /**
   * Check if user can approve an entry
   * Only admin can approve, and only when status is pending_approval
   */
  const canApprove = useCallback(
    (entry) => {
      if (!entry) return false;
      if (!hasRole(ROLES.ADMIN)) return false;
      return entry.status === STATUS_VALUES.PENDING_APPROVAL;
    },
    [hasRole]
  );

  /**
   * Check if user can mark entry as paid (process payment)
   * Accounts and admin can do this when status is approved
   */
  const canMarkPaid = useCallback(
    (entry) => {
      if (!entry) return false;
      if (!hasRole([ROLES.ACCOUNTS, ROLES.ADMIN])) return false;
      return entry.status === STATUS_VALUES.APPROVED;
    },
    [hasRole]
  );

  /**
   * Get current status label for display
   */
  const getStatusLabel = useCallback((entry) => {
    if (!entry) return 'Unknown';

    switch (entry.status) {
      case STATUS_VALUES.PENDING_APPROVAL:
        return 'Pending Approval';
      case STATUS_VALUES.APPROVED:
        return 'Approved - Awaiting Payment';
      case STATUS_VALUES.REJECTED:
        return 'Rejected';
      case STATUS_VALUES.CLOSED:
        return `Payment Processed${entry.paymentMode ? ` (${entry.paymentMode})` : ''}`;
      default:
        return 'Pending Approval';
    }
  }, []);

  /**
   * Get workflow step (0-3)
   * 0: Pending Approval, 1: Approved, 2: Payment Processed, -1: Rejected
   */
  const getWorkflowStep = useCallback((entry) => {
    if (!entry) return 0;

    switch (entry.status) {
      case STATUS_VALUES.CLOSED:
        return 2;
      case STATUS_VALUES.APPROVED:
        return 1;
      case STATUS_VALUES.REJECTED:
        return -1;
      default:
        return 0;
    }
  }, []);

  /**
   * Handle approve action
   */
  const handleApprove = useCallback(
    async (module, id, notes = '') => {
      return approveEntry(module, id, notes);
    },
    [approveEntry]
  );

  /**
   * Handle reject action
   */
  const handleReject = useCallback(
    async (module, id, notes = '') => {
      return rejectEntry(module, id, notes);
    },
    [rejectEntry]
  );

  /**
   * Handle mark as paid action (with payment mode)
   */
  const handleMarkPaid = useCallback(
    async (module, id, paymentMode) => {
      return markAsPaid(module, id, paymentMode);
    },
    [markAsPaid]
  );

  /**
   * Get approval stats
   */
  const stats = useMemo(() => {
    const allEntries = getAllEntries();

    return {
      total: allEntries.length,
      pendingApproval: allEntries.filter(
        (e) => e.status === STATUS_VALUES.PENDING_APPROVAL
      ).length,
      approved: allEntries.filter(
        (e) => e.status === STATUS_VALUES.APPROVED
      ).length,
      closed: allEntries.filter((e) => e.status === STATUS_VALUES.CLOSED).length,
      rejected: allEntries.filter(
        (e) => e.status === STATUS_VALUES.REJECTED
      ).length,
    };
  }, [getAllEntries]);

  return {
    // Entries by status
    pendingApprovalEntries,
    awaitingPaymentEntries,
    approvedEntries,
    rejectedEntries,
    completedEntries,
    // Permission checks
    canApprove,
    canMarkPaid,
    // Actions
    handleApprove,
    handleReject,
    handleMarkPaid,
    // Utilities
    getStatusLabel,
    getWorkflowStep,
    stats,
  };
};

export default useApprovalWorkflow;
