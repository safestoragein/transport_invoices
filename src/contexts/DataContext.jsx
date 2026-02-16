import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAudit } from './AuditContext';
import { STATUS_VALUES, AUDIT_ACTIONS } from '../utils/constants';
import { calculateProfitLoss, generateId } from '../utils/calculations';
import * as supabaseService from '../services/supabaseService';

const DataContext = createContext(null);

/**
 * Data Provider - All module data with CRUD + approval operations
 * Backed by Supabase (single "bills" table, split by module column)
 */
export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const { logAction } = useAudit();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module data arrays (populated from Supabase on mount)
  const [transportInvoices, setTransportInvoices] = useState([]);
  const [generalBills, setGeneralBills] = useState([]);
  const [packingMaterials, setPackingMaterials] = useState([]);
  const [pettyCash, setPettyCash] = useState([]);
  const [happyCard, setHappyCard] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [driveTrackPorter, setDriveTrackPorter] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Map module key -> [state, setter]
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

  // ============ Fetch all data on mount ============
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const allBills = await supabaseService.fetchAllBills();

        if (cancelled) return;

        // Split by module
        const buckets = {
          transport: [],
          general: [],
          packing: [],
          petty: [],
          happy: [],
          refunds: [],
          drive: [],
          reviews: [],
        };

        allBills.forEach((bill) => {
          if (buckets[bill.module]) {
            buckets[bill.module].push(bill);
          }
        });

        setTransportInvoices(buckets.transport);
        setGeneralBills(buckets.general);
        setPackingMaterials(buckets.packing);
        setPettyCash(buckets.petty);
        setHappyCard(buckets.happy);
        setRefunds(buckets.refunds);
        setDriveTrackPorter(buckets.drive);
        setReviews(buckets.reviews);
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

  /**
   * Create a new entry in a module
   */
  const createEntry = useCallback(async (module, data) => {
    const moduleState = getModuleState(module);
    if (!moduleState) {
      console.error(`Unknown module: ${module}`);
      return null;
    }
    const [, setItems] = moduleState;

    // Calculate P/L for transport invoices
    let entryData = { ...data };
    if (module === 'transport') {
      entryData.profitLoss = calculateProfitLoss(
        data.receivedAmount,
        data.packingMaterial,
        data.invoiceAmount
      );
    }

    // Add default status — new entries go to pending_approval
    const newEntry = {
      ...entryData,
      id: generateId(),
      status: STATUS_VALUES.PENDING_APPROVAL,
      submittedBy: user?.username || 'system',
      submittedAt: new Date().toISOString(),
    };

    // Optimistic update
    setItems((prev) => [...prev, newEntry]);

    try {
      await supabaseService.insertBill(module, newEntry);
    } catch (err) {
      console.error('Supabase insert failed, rolling back:', err);
      setItems((prev) => prev.filter((item) => item.id !== newEntry.id));
      return null;
    }

    // Log audit
    logAction({
      action: AUDIT_ACTIONS.CREATE,
      module,
      recordId: newEntry.id,
      newValue: newEntry,
      details: `Created new ${module} entry`,
    });

    return newEntry;
  }, [user, getModuleState, logAction]);

  /**
   * Update an entry in a module
   */
  const updateEntry = useCallback(async (module, id, updates) => {
    const moduleState = getModuleState(module);
    if (!moduleState) {
      console.error(`Unknown module: ${module}`);
      return null;
    }
    const [items, setItems] = moduleState;

    const previousValue = items.find((item) => item.id === id);
    if (!previousValue) {
      console.error(`Entry not found: ${id}`);
      return null;
    }

    // Calculate P/L for transport invoices if amounts changed
    let entryUpdates = { ...updates };
    if (module === 'transport' &&
        (updates.receivedAmount !== undefined ||
         updates.packingMaterial !== undefined ||
         updates.invoiceAmount !== undefined)) {
      entryUpdates.profitLoss = calculateProfitLoss(
        updates.receivedAmount ?? previousValue.receivedAmount,
        updates.packingMaterial ?? previousValue.packingMaterial,
        updates.invoiceAmount ?? previousValue.invoiceAmount
      );
    }

    const updatedEntry = { ...previousValue, ...entryUpdates, updatedAt: new Date().toISOString() };

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedEntry : item))
    );

    try {
      await supabaseService.updateBill(id, entryUpdates);
    } catch (err) {
      console.error('Supabase update failed, rolling back:', err);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? previousValue : item))
      );
      return null;
    }

    // Log audit
    logAction({
      action: AUDIT_ACTIONS.UPDATE,
      module,
      recordId: id,
      previousValue,
      newValue: updatedEntry,
      changes: Object.entries(entryUpdates)
        .filter(([key, value]) => previousValue[key] !== value)
        .map(([key, value]) => ({
          field: key,
          from: previousValue[key],
          to: value,
        })),
    });

    return updatedEntry;
  }, [getModuleState, logAction]);

  /**
   * Delete an entry from a module
   */
  const deleteEntry = useCallback(async (module, id) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const previousValue = items.find((item) => item.id === id);
    if (!previousValue) return false;

    // Optimistic update
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await supabaseService.deleteBill(id);
    } catch (err) {
      console.error('Supabase delete failed, rolling back:', err);
      setItems((prev) => [...prev, previousValue]);
      return false;
    }

    // Log audit
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
   * Approve an entry (admin only)
   * Sets status to 'approved' (awaiting payment)
   */
  const approveEntry = useCallback(async (module, id, notes = '') => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    const updates = {
      notes,
      status: STATUS_VALUES.APPROVED,
      approvedBy: user?.username,
      approvalDate: new Date().toISOString(),
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() };

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedEntry : item))
    );

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      console.error('Supabase approve failed, rolling back:', err);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? entry : item))
      );
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.APPROVE,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: 'Admin approved entry',
    });

    return true;
  }, [user, getModuleState, logAction]);

  /**
   * Reject an entry (admin only)
   * Sets status to 'rejected' with notes
   */
  const rejectEntry = useCallback(async (module, id, notes = '') => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    const updates = {
      notes,
      status: STATUS_VALUES.REJECTED,
      rejectedBy: user?.username,
      rejectionDate: new Date().toISOString(),
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() };

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedEntry : item))
    );

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      console.error('Supabase reject failed, rolling back:', err);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? entry : item))
      );
      return false;
    }

    logAction({
      action: AUDIT_ACTIONS.REJECT,
      module,
      recordId: id,
      previousValue: entry,
      newValue: updatedEntry,
      details: 'Admin rejected entry',
    });

    return true;
  }, [user, getModuleState, logAction]);

  /**
   * Mark entry as paid (accounts or admin)
   * Accepts paymentMode ('Bank' or 'Cashfree'), sets status to 'closed'
   */
  const markAsPaid = useCallback(async (module, id, paymentMode) => {
    const moduleState = getModuleState(module);
    if (!moduleState) return false;
    const [items, setItems] = moduleState;

    const entry = items.find((item) => item.id === id);
    if (!entry) return false;

    const updates = {
      status: STATUS_VALUES.CLOSED,
      paymentMode,
      paymentCompletedDate: new Date().toISOString(),
      paymentCompletedBy: user.username,
    };

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date().toISOString() };

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedEntry : item))
    );

    try {
      await supabaseService.updateBill(id, updates);
    } catch (err) {
      console.error('Supabase markAsPaid failed, rolling back:', err);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? entry : item))
      );
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

  // ============ Bulk Operations ============

  const bulkApprove = useCallback((module, ids, notes = '') => {
    ids.forEach(id => approveEntry(module, id, notes));
  }, [approveEntry]);

  const bulkReject = useCallback((module, ids, notes = '') => {
    ids.forEach(id => rejectEntry(module, id, notes));
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
    // CRUD operations
    createEntry,
    updateEntry,
    deleteEntry,
    // Approval operations
    approveEntry,
    rejectEntry,
    markAsPaid,
    bulkApprove,
    bulkReject,
    // Utilities
    getAllEntries,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Hook to use data context
 */
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
