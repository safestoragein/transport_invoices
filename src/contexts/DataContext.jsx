import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAudit } from './AuditContext';
import { STATUS_VALUES, AUDIT_ACTIONS, isValidTransition } from '../utils/constants';
import { calculateTransportFields, calculatePaymentStatus, calculateGroupTotals, generateId } from '../utils/calculations';
import { canEditBill, validateDuplicateInvoice, validatePaymentAmount } from '../utils/validators';
import * as supabaseService from '../services/supabaseService';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const { logAction } = useAudit();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module data arrays
  const [transportInvoices, setTransportInvoices] = useState([]);
  const [generalBills, setGeneralBills] = useState([]);
  const [packingMaterials, setPackingMaterials] = useState([]);
  const [pettyCash, setPettyCash] = useState([]);
  const [happyCard, setHappyCard] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [driveTrackPorter, setDriveTrackPorter] = useState([]);
  const [reviews, setReviews] = useState([]);

  // New: Transport groups and bill payments
  const [transportGroups, setTransportGroups] = useState([]);
  const [billPayments, setBillPayments] = useState([]);

  const getModuleState = useCallback((module) => {
    const map = {
      transport: [transportInvoices, setTransportInvoices],
      general: [generalBills, setGeneralBills],
      packing: [packingMaterials, setPackingMaterials],
      petty: [pettyCash, setPettyCash],
      happy: [happyCard, setHappyCard],
      refunds: [refunds, setRefunds],
      drive: [driveTrackPorter, setDriveTrackPorter],
      reviews: [reviews, setReviews],
    };
    return map[module] || null;
  }, [transportInvoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  // Load all data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [allBills, groups, payments] = await Promise.all([
          supabaseService.fetchAllBills(),
          supabaseService.fetchTransportGroups().catch(() => []),
          supabaseService.fetchAllPayments().catch(() => []),
        ]);

        if (cancelled) return;

        const buckets = {
          transport: [], general: [], packing: [], petty: [],
          happy: [], refunds: [], drive: [], reviews: [],
        };

        allBills.forEach((bill) => {
          if (buckets[bill.module]) buckets[bill.module].push(bill);
        });

        setTransportInvoices(buckets.transport);
        setGeneralBills(buckets.general);
        setPackingMaterials(buckets.packing);
        setPettyCash(buckets.petty);
        setHappyCard(buckets.happy);
        setRefunds(buckets.refunds);
        setDriveTrackPorter(buckets.drive);
        setReviews(buckets.reviews);
        setTransportGroups(groups);
        setBillPayments(payments);
        setError(null);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // ============ Generic CRUD Operations ============

  const createEntry = useCallback(async (module, data) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return null;
    const [items, setItems] = moduleState;

    // Duplicate invoice check
    const invoiceNum = data.invoiceNumber || data.invoiceNo;
    if (invoiceNum) {
      const allItems = getAllEntries();
      const dupError = validateDuplicateInvoice(invoiceNum, allItems);
      if (dupError) {
        throw new Error(dupError);
      }
    }

    let entryData = { ...data };

    // Calculate transport fields
    if (module === 'transport') {
      const calc = calculateTransportFields(data);
      entryData = { ...entryData, ...calc };
    }

    const now = new Date().toISOString();
    const newEntry = {
      ...entryData,
      id: generateId(),
      status: STATUS_VALUES.PENDING_APPROVAL,
      managerApproval: 'pending',
      paymentStatus: entryData.paymentStatus || 'Pending',
      submittedBy: user?.username || 'system',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    setItems((prev) => [...prev, newEntry]);

    try {
      await supabaseService.insertBill(module, newEntry);
    } catch (err) {
      setItems((prev) => prev.filter((item) => item.id !== newEntry.id));
      throw err;
    }

    logAction({
      action: AUDIT_ACTIONS.CREATE,
      module,
      recordId: newEntry.id,
      newValue: newEntry,
      details: `Created new ${module} entry`,
    });

    return newEntry;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, getModuleState, logAction]);

  const updateEntry = useCallback(async (module, id, updates) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return null;
    const [items, setItems] = moduleState;

    const previousValue = items.find((item) => item.id === id);
    if (!previousValue) return null;

    // Prevent edit after PAYMENT_DONE
    if (!canEditBill(previousValue)) {
      throw new Error('Cannot edit a bill after payment is completed');
    }

    // Duplicate invoice check on update
    const invoiceNum = updates.invoiceNumber || updates.invoiceNo;
    if (invoiceNum) {
      const allItems = getAllEntries();
      const dupError = validateDuplicateInvoice(invoiceNum, allItems, id);
      if (dupError) {
        throw new Error(dupError);
      }
    }

    let entryUpdates = { ...updates };

    // Recalculate transport fields if amounts changed
    if (module === 'transport' &&
        (updates.receivedAmount !== undefined || updates.packingMaterial !== undefined ||
         updates.invoiceAmount !== undefined || updates.tdsPercentage !== undefined ||
         updates.tdsApplicable !== undefined || updates.penaltyAmount !== undefined)) {
      const mergedData = { ...previousValue, ...updates };
      const calc = calculateTransportFields(mergedData);
      entryUpdates = { ...entryUpdates, ...calc };
    }

    const updatedEntry = { ...previousValue, ...entryUpdates, updatedAt: new Date().toISOString() };

    setItems((prev) => prev.map((item) => (item.id === id ? updatedEntry : item)));

    try {
      await supabaseService.updateBill(id, entryUpdates);
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === id ? previousValue : item)));
      throw err;
    }

    logAction({
      action: AUDIT_ACTIONS.UPDATE,
      module,
      recordId: id,
      previousValue,
      newValue: updatedEntry,
      changes: Object.entries(entryUpdates)
        .filter(([key, value]) => previousValue[key] !== value)
        .map(([key, value]) => ({ field: key, from: previousValue[key], to: value })),
    });

    return updatedEntry;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getModuleState, logAction]);

  const deleteEntry = useCallback(async (module, id) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const previousValue = items.find((item) => item.id === id);
    if (!previousValue) return false;

    if (!canEditBill(previousValue)) {
      throw new Error('Cannot delete a bill after payment is completed');
    }

    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await supabaseService.deleteBill(id);
    } catch (err) {
      setItems((prev) => [...prev, previousValue]);
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.DELETE,
      module,
      recordId: id,
      previousValue,
      details: `Deleted ${module} entry`,
    });

    return true;
  }, [getModuleState, logAction]);

  // ============ Approval Workflow Operations ============

  /**
   * Approve an entry: PENDING_APPROVAL → READY_FOR_UPLOAD
   */
  const approveEntry = useCallback(async (module, id, notes = '') => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    // Validate transition
    if (!isValidTransition(entry.status, STATUS_VALUES.READY_FOR_UPLOAD)) {
      console.error(`Invalid transition from ${entry.status} to ${STATUS_VALUES.READY_FOR_UPLOAD}`);
      return false;
    }

    const now = new Date().toISOString();
    const updates = {
      notes,
      status: STATUS_VALUES.READY_FOR_UPLOAD,
      approvedBy: user?.username,
      approvalDate: now,
      approvalTimestamp: now,
      managerApproval: 'approved',
      managerApprovedBy: user?.username,
      managerApprovalDate: now,
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: now };
    setItems((prev) => prev.map((item) => (item.id === id ? updatedEntry : item)));

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === id ? entry : item)));
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.APPROVE,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: `Approved by ${user?.username}`,
    });

    return true;
  }, [user, getModuleState, logAction]);

  /**
   * Reject an entry
   */
  const rejectEntry = useCallback(async (module, id, notes = '') => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    const now = new Date().toISOString();
    const updates = {
      notes,
      status: STATUS_VALUES.REJECTED,
      rejectedBy: user?.username,
      rejectionDate: now,
      managerApproval: 'rejected',
      managerApprovedBy: user?.username,
      managerApprovalDate: now,
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: now };
    setItems((prev) => prev.map((item) => (item.id === id ? updatedEntry : item)));

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === id ? entry : item)));
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.REJECT,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: `Rejected by ${user?.username}`,
    });

    return true;
  }, [user, getModuleState, logAction]);

  /**
   * Upload for payment: READY_FOR_UPLOAD → UPLOADED_TO_BANK
   */
  const uploadForPayment = useCallback(async (module, id) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    if (!isValidTransition(entry.status, STATUS_VALUES.UPLOADED_TO_BANK)) {
      console.error(`Invalid transition from ${entry.status} to ${STATUS_VALUES.UPLOADED_TO_BANK}`);
      return false;
    }

    const now = new Date().toISOString();
    const updates = {
      status: STATUS_VALUES.UPLOADED_TO_BANK,
      paymentStatus: 'Uploaded',
      uploadedBy: user?.username || 'system',
      uploadedTimestamp: now,
      uploadedForPaymentBy: user?.username || 'system',
      uploadedForPaymentDate: now,
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: now };
    setItems((prev) => prev.map((item) => (item.id === id ? updatedEntry : item)));

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === id ? entry : item)));
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.UPLOAD_FOR_PAYMENT,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: `Uploaded for payment via ${entry.paymentMode || 'unknown'}`,
    });

    return true;
  }, [user, getModuleState, logAction]);

  /**
   * Mark as paid: UPLOADED_TO_BANK → PAYMENT_DONE
   */
  const markAsPaid = useCallback(async (module, id, paymentMode) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    if (!isValidTransition(entry.status, STATUS_VALUES.PAYMENT_DONE)) {
      console.error(`Invalid transition from ${entry.status} to ${STATUS_VALUES.PAYMENT_DONE}`);
      return false;
    }

    const now = new Date().toISOString();
    const updates = {
      status: STATUS_VALUES.PAYMENT_DONE,
      paymentStatus: 'Payment done',
      paymentMode,
      paymentDate: now,
      paymentCompletedDate: now,
      paymentCompletedBy: user?.username || 'system',
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: now };
    setItems((prev) => prev.map((item) => (item.id === id ? updatedEntry : item)));

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === id ? entry : item)));
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.MARK_PAID,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: `Payment processed via ${paymentMode}`,
    });

    return true;
  }, [user, getModuleState, logAction]);

  /**
   * Put entry on hold
   */
  const putOnHold = useCallback(async (module, id, notes = '') => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    const updates = {
      status: STATUS_VALUES.ON_HOLD,
      notes: notes || entry.notes,
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() };
    setItems((prev) => prev.map((item) => (item.id === id ? updatedEntry : item)));

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      setItems((prev) => prev.map((item) => (item.id === id ? entry : item)));
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.UPDATE,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: 'Entry put on hold',
    });

    return true;
  }, [getModuleState, logAction]);

  // ============ Bill Payments Operations ============

  /**
   * Add a payment to a bill (multiple payments support)
   */
  const addPayment = useCallback(async (billId, paymentData) => {
    // Find the bill across all modules
    const allItems = getAllEntries();
    const bill = allItems.find(item => item.id === billId);
    if (!bill) throw new Error('Bill not found');

    // Get existing payments for this bill
    const existingPayments = billPayments.filter(p => p.billId === billId);
    const finalPayable = Number(bill.finalPayable) || Number(bill.payableAmount) || Number(bill.amount) || 0;
    const totalPaid = existingPayments.reduce((sum, p) => sum + (Number(p.paymentAmount) || 0), 0);

    // Validate payment amount (prevent overpayment)
    const validationError = validatePaymentAmount(paymentData.paymentAmount, finalPayable, totalPaid);
    if (validationError) throw new Error(validationError);

    const payment = {
      paymentId: generateId(),
      billId,
      paymentAmount: Number(paymentData.paymentAmount),
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentReference: paymentData.paymentReference || '',
      paymentMode: paymentData.paymentMode || bill.paymentMode,
      createdBy: user?.username || 'system',
      notes: paymentData.notes || '',
    };

    // Optimistic update
    setBillPayments(prev => [payment, ...prev]);

    try {
      await supabaseService.insertBillPayment(payment);
    } catch (err) {
      setBillPayments(prev => prev.filter(p => p.paymentId !== payment.paymentId));
      throw err;
    }

    // Recalculate payment status
    const newTotalPaid = totalPaid + payment.paymentAmount;
    const { paymentStatus } = calculatePaymentStatus(finalPayable, [...existingPayments, payment]);

    // Update bill payment status (but NOT profit_loss)
    const moduleState = getModuleState(bill.module);
    if (moduleState) {
      const [, setItems] = moduleState;
      setItems(prev => prev.map(item =>
        item.id === billId ? { ...item, paymentStatus } : item
      ));
      await supabaseService.updateBill(billId, { paymentStatus }).catch(() => {});
    }

    logAction({
      action: AUDIT_ACTIONS.ADD_PAYMENT,
      module: bill.module,
      recordId: billId,
      newValue: payment,
      details: `Payment of ${payment.paymentAmount} added. Total paid: ${newTotalPaid}`,
    });

    return payment;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billPayments, user, getModuleState, logAction]);

  /**
   * Get payments for a specific bill
   */
  const getPaymentsForBill = useCallback((billId) => {
    return billPayments.filter(p => p.billId === billId);
  }, [billPayments]);

  // ============ Transport Groups Operations ============

  const createTransportGroup = useCallback(async (groupData) => {
    const group = {
      groupId: generateId(),
      groupName: groupData.groupName,
      vendorName: groupData.vendorName,
      weekStart: groupData.weekStart,
      weekEnd: groupData.weekEnd,
      totalReceived: 0,
      totalPackingMaterial: 0,
      totalInvoiceAmount: 0,
      totalTds: 0,
      totalPenalty: 0,
      totalFinalPayable: 0,
      totalProfit: 0,
      createdBy: user?.username || 'system',
    };

    setTransportGroups(prev => [group, ...prev]);

    try {
      await supabaseService.insertTransportGroup(group);
    } catch (err) {
      setTransportGroups(prev => prev.filter(g => g.groupId !== group.groupId));
      throw err;
    }

    return group;
  }, [user]);

  const assignToGroup = useCallback(async (billId, groupId) => {
    const bill = transportInvoices.find(b => b.id === billId);
    if (!bill) return false;

    const prev = bill.weeklyGroupId;
    setTransportInvoices(items => items.map(item =>
      item.id === billId ? { ...item, weeklyGroupId: groupId } : item
    ));

    try {
      await supabaseService.updateBill(billId, { weeklyGroupId: groupId });
    } catch (err) {
      setTransportInvoices(items => items.map(item =>
        item.id === billId ? { ...item, weeklyGroupId: prev } : item
      ));
      return false;
    }

    // Recalculate group totals
    recalculateGroupTotals(groupId);
    if (prev) recalculateGroupTotals(prev);

    return true;
  }, [transportInvoices]);

  const recalculateGroupTotals = useCallback(async (groupId) => {
    const groupInvoices = transportInvoices.filter(inv => inv.weeklyGroupId === groupId);
    const totals = calculateGroupTotals(groupInvoices);

    setTransportGroups(prev => prev.map(g =>
      g.groupId === groupId ? { ...g, ...totals } : g
    ));

    await supabaseService.updateTransportGroup(groupId, totals).catch(() => {});
  }, [transportInvoices]);

  // ============ Bulk Operations ============

  const bulkApprove = useCallback(async (module, ids, notes = '') => {
    let failed = 0;
    for (const id of ids) {
      const result = await approveEntry(module, id, notes);
      if (!result) failed++;
    }
    return { total: ids.length, failed };
  }, [approveEntry]);

  const bulkReject = useCallback(async (module, ids, notes = '') => {
    let failed = 0;
    for (const id of ids) {
      const result = await rejectEntry(module, id, notes);
      if (!result) failed++;
    }
    return { total: ids.length, failed };
  }, [rejectEntry]);

  /**
   * Get all entries across all modules
   */
  const getAllEntries = useCallback(() => {
    return [
      ...transportInvoices.map(item => ({ ...item, module: 'transport' })),
      ...generalBills.map(item => ({ ...item, module: 'general' })),
      ...packingMaterials.map(item => ({ ...item, module: 'packing' })),
      ...pettyCash.map(item => ({ ...item, module: 'petty' })),
      ...happyCard.map(item => ({ ...item, module: 'happy' })),
      ...refunds.map(item => ({ ...item, module: 'refunds' })),
      ...driveTrackPorter.map(item => ({ ...item, module: 'drive' })),
      ...reviews.map(item => ({ ...item, module: 'reviews' })),
    ];
  }, [transportInvoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  const value = {
    loading,
    error,
    // Module data
    transportInvoices,
    generalBills,
    packingMaterials,
    pettyCash,
    happyCard,
    refunds,
    driveTrackPorter,
    reviews,
    // New data
    transportGroups,
    billPayments,
    // CRUD operations
    createEntry,
    updateEntry,
    deleteEntry,
    // Approval operations
    approveEntry,
    rejectEntry,
    markAsPaid,
    uploadForPayment,
    putOnHold,
    bulkApprove,
    bulkReject,
    // Payment operations
    addPayment,
    getPaymentsForBill,
    // Group operations
    createTransportGroup,
    assignToGroup,
    recalculateGroupTotals,
    // Utilities
    getAllEntries,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
