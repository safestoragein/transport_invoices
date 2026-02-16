import React from 'react';
import { useAudit } from '../../contexts/AuditContext';
import { Badge } from '../common';
import { formatDateTime } from '../../utils/formatters';
import { AUDIT_ACTIONS } from '../../utils/constants';

/**
 * HistoryPanel component - Record history sidebar
 */
const HistoryPanel = ({ module, recordId, onClose }) => {
  const { getRecordHistory, formatAction } = useAudit();

  const history = getRecordHistory(module, recordId);

  const getActionIcon = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.CREATE:
        return (
          <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case AUDIT_ACTIONS.UPDATE:
        return (
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case AUDIT_ACTIONS.DELETE:
        return (
          <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      case AUDIT_ACTIONS.APPROVE:
        return (
          <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case AUDIT_ACTIONS.REJECT:
        return (
          <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case AUDIT_ACTIONS.MARK_PAID:
        return (
          <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case AUDIT_ACTIONS.CREATE:
      case AUDIT_ACTIONS.APPROVE:
      case AUDIT_ACTIONS.MARK_PAID:
        return 'success';
      case AUDIT_ACTIONS.UPDATE:
        return 'primary';
      case AUDIT_ACTIONS.DELETE:
      case AUDIT_ACTIONS.REJECT:
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Record History</h2>
          <p className="text-sm text-gray-500">ID: {recordId}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-6">
        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No history found for this record</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative pl-12">
                  {/* Timeline icon */}
                  <div className="absolute left-0">
                    {getActionIcon(entry.action)}
                  </div>

                  {/* Content */}
                  <div className={`bg-gray-50 rounded-lg p-4 ${index === 0 ? 'ring-2 ring-primary-200' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getActionBadgeVariant(entry.action)} size="sm">
                        {formatAction(entry.action)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      by <span className="font-medium">{entry.username || entry.userId}</span>
                    </p>

                    {entry.details && (
                      <p className="text-sm text-gray-700 mb-3">{entry.details}</p>
                    )}

                    {/* Changes */}
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase">Changes</p>
                        {entry.changes.map((change, idx) => (
                          <div key={idx} className="text-sm bg-white rounded px-3 py-2 border">
                            <span className="font-medium text-gray-700">{change.field}:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-danger-600 text-xs line-through">
                                {String(change.from ?? 'empty')}
                              </span>
                              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span className="text-success-600 text-xs">
                                {String(change.to ?? 'empty')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Wrapper to show HistoryPanel as a modal overlay
 */
export const HistoryModal = ({ isOpen, module, recordId, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <HistoryPanel module={module} recordId={recordId} onClose={onClose} />
    </>
  );
};

export default HistoryPanel;
