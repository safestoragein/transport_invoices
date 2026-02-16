import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AUDIT_ACTIONS } from '../utils/constants';
import * as supabaseService from '../services/supabaseService';

const AuditContext = createContext(null);

/**
 * Audit Provider - Audit logging backed by Supabase audit_logs table
 */
export const AuditProvider = ({ children }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  // Fetch audit logs on mount
  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      try {
        const data = await supabaseService.fetchAuditLogs({ limit: 1000 });
        if (!cancelled) {
          setLogs(data);
          setLogsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        if (!cancelled) setLogsLoaded(true);
      }
    }

    loadLogs();
    return () => { cancelled = true; };
  }, []);

  /**
   * Re-fetch logs from Supabase (call after writes)
   */
  const refreshLogs = useCallback(async () => {
    try {
      const data = await supabaseService.fetchAuditLogs({ limit: 1000 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to refresh audit logs:', err);
    }
  }, []);

  /**
   * Log an audit action
   */
  const logAction = useCallback((options) => {
    const {
      action,
      module,
      recordId,
      previousValue,
      newValue,
      changes,
      details,
    } = options;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const entry = {
      id,
      action,
      module,
      recordId,
      userId: user?.username || 'system',
      username: user?.displayName || user?.username || 'System',
      previousValue: previousValue ? JSON.stringify(previousValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      changes: changes || calculateChanges(previousValue, newValue),
      details,
      timestamp,
    };

    // Optimistic: add to local cache immediately
    setLogs((prev) => [entry, ...prev]);

    // Write to Supabase (fire-and-forget)
    supabaseService.insertAuditLog(entry).catch((err) => {
      console.error('Failed to write audit log to Supabase:', err);
    });

    return entry;
  }, [user]);

  /**
   * Calculate field changes between two objects
   */
  const calculateChanges = (previousValue, newValue) => {
    if (!previousValue || !newValue) return [];

    const changes = [];
    const allKeys = new Set([
      ...Object.keys(previousValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    allKeys.forEach((key) => {
      if (['id', 'createdAt', 'updatedAt'].includes(key)) return;

      const prevVal = previousValue?.[key];
      const newVal = newValue?.[key];

      if (JSON.stringify(prevVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          from: prevVal,
          to: newVal,
        });
      }
    });

    return changes;
  };

  /**
   * Get audit logs with optional filtering (from cached state)
   */
  const getAuditLogs = useCallback((options = {}) => {
    const { limit = 100, module, action, userId } = options;
    let filtered = logs;

    if (module) {
      filtered = filtered.filter((log) => log.module === module);
    }
    if (action) {
      filtered = filtered.filter((log) => log.action === action);
    }
    if (userId) {
      filtered = filtered.filter((log) => log.userId === userId);
    }

    return filtered.slice(0, limit);
  }, [logs]);

  /**
   * Get audit history for a specific record
   */
  const getRecordHistory = useCallback((module, recordId) => {
    return getAuditLogs({ module }).filter((log) => log.recordId === recordId);
  }, [getAuditLogs]);

  /**
   * Get user activity log
   */
  const getUserActivity = useCallback((userId, limit = 50) => {
    return getAuditLogs({ userId, limit });
  }, [getAuditLogs]);

  /**
   * Get recent actions
   */
  const getRecentActions = useCallback((limit = 20) => {
    return getAuditLogs({ limit });
  }, [getAuditLogs]);

  /**
   * Get action statistics
   */
  const getActionStats = useCallback(() => {
    const stats = {
      total: logs.length,
      byAction: {},
      byModule: {},
      byUser: {},
      today: 0,
      thisWeek: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    logs.forEach((log) => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      if (log.module) {
        stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
      }

      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;

      const logDate = new Date(log.timestamp);
      if (logDate >= today) {
        stats.today++;
      }
      if (logDate >= weekAgo) {
        stats.thisWeek++;
      }
    });

    return stats;
  }, [logs]);

  /**
   * Format audit action for display
   */
  const formatAction = useCallback((action) => {
    const actionLabels = {
      [AUDIT_ACTIONS.CREATE]: 'Created',
      [AUDIT_ACTIONS.UPDATE]: 'Updated',
      [AUDIT_ACTIONS.DELETE]: 'Deleted',
      [AUDIT_ACTIONS.APPROVE]: 'Approved',
      [AUDIT_ACTIONS.REJECT]: 'Rejected',
      [AUDIT_ACTIONS.MARK_PAID]: 'Marked as Paid',
      [AUDIT_ACTIONS.LOGIN]: 'Logged In',
      [AUDIT_ACTIONS.LOGOUT]: 'Logged Out',
    };
    return actionLabels[action] || action;
  }, []);

  const value = {
    logAction,
    getAuditLogs,
    getRecordHistory,
    getUserActivity,
    getRecentActions,
    getActionStats,
    formatAction,
    calculateChanges,
    refreshLogs,
    logsLoaded,
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
};

/**
 * Hook to use audit context
 */
export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};

export default AuditContext;
