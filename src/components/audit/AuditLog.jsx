import React, { useState, useMemo } from 'react';
import { useAudit } from '../../contexts/AuditContext';
import { useFilters, usePagination } from '../../hooks';
import { Badge } from '../common';
import { formatDateTime } from '../../utils/formatters';
import { MODULE_CONFIG, AUDIT_ACTIONS } from '../../utils/constants';

/**
 * AuditLog component - Paginated audit viewer
 */
const AuditLog = ({ module: filterModule, recordId: filterRecordId }) => {
  const { getAuditLogs, formatAction } = useAudit();
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Get audit logs
  const allLogs = useMemo(() => {
    const options = {};
    if (filterModule) options.module = filterModule;
    return getAuditLogs({ limit: 500, ...options });
  }, [getAuditLogs, filterModule]);

  // Filter by recordId if provided
  const filteredByRecord = useMemo(() => {
    if (!filterRecordId) return allLogs;
    return allLogs.filter(log => log.recordId === filterRecordId);
  }, [allLogs, filterRecordId]);

  // Use filters hook
  const {
    filters,
    filteredData,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    getUniqueValues,
  } = useFilters(filteredByRecord, {
    moduleName: 'audit',
    searchFields: ['username', 'details', 'action'],
    dateField: 'timestamp',
    persistFilters: false,
  });

  // Use pagination hook
  const {
    paginatedData,
    currentPage,
    totalPages,
    pageSize,
    goToPage,
    changePageSize,
    showingRange,
  } = usePagination(filteredData, { initialPageSize: 25 });

  const toggleExpanded = (id) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.CREATE:
        return 'success';
      case AUDIT_ACTIONS.UPDATE:
        return 'primary';
      case AUDIT_ACTIONS.DELETE:
        return 'danger';
      case AUDIT_ACTIONS.APPROVE:
        return 'success';
      case AUDIT_ACTIONS.REJECT:
        return 'danger';
      case AUDIT_ACTIONS.MARK_PAID:
        return 'success';
      case AUDIT_ACTIONS.LOGIN:
      case AUDIT_ACTIONS.LOGOUT:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getModuleLabel = (module) => {
    return MODULE_CONFIG[module]?.label || module || 'System';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={filters.custom?.action || ''}
            onChange={(e) => updateFilter('custom', { ...filters.custom, action: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Actions</option>
            {Object.values(AUDIT_ACTIONS).map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>

          {/* Module Filter */}
          {!filterModule && (
            <select
              value={filters.custom?.module || ''}
              onChange={(e) => updateFilter('custom', { ...filters.custom, module: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            >
              <option value="">All Modules</option>
              {getUniqueValues('module').map((mod) => (
                <option key={mod} value={mod}>
                  {getModuleLabel(mod)}
                </option>
              ))}
            </select>
          )}

          {/* User Filter */}
          <select
            value={filters.custom?.userId || ''}
            onChange={(e) => updateFilter('custom', { ...filters.custom, userId: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">All Users</option>
            {getUniqueValues('userId').map((userId) => (
              <option key={userId} value={userId}>
                {userId}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Module
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Details
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                paginatedData.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpanded(log.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {log.username || log.userId}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                          {formatAction(log.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getModuleLabel(log.module)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedRows.has(log.id) ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    {/* Expanded Row */}
                    {expandedRows.has(log.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            {log.recordId && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase">
                                  Record ID:
                                </span>
                                <span className="ml-2 text-sm text-gray-700 font-mono">
                                  {log.recordId}
                                </span>
                              </div>
                            )}
                            {log.changes && log.changes.length > 0 && (
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase block mb-2">
                                  Changes:
                                </span>
                                <div className="space-y-1">
                                  {log.changes.map((change, idx) => (
                                    <div
                                      key={idx}
                                      className="text-sm bg-white rounded px-3 py-2 border"
                                    >
                                      <span className="font-medium text-gray-700">
                                        {change.field}:
                                      </span>
                                      <span className="text-danger-600 ml-2 line-through">
                                        {String(change.from ?? 'null')}
                                      </span>
                                      <span className="mx-2 text-gray-400">→</span>
                                      <span className="text-success-600">
                                        {String(change.to ?? 'null')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {showingRange.start} to {showingRange.end} of {showingRange.total} entries
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
