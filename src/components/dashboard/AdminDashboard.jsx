import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAudit } from '../../contexts/AuditContext';
import { Card, CardHeader, Button, Alert } from '../common';
import { StatCard, StatCardGrid } from '../common/StatCard';
import { AuditLog } from '../audit';
import storageService from '../../services/storageService';
import { formatCurrency } from '../../utils/formatters';

/**
 * AdminDashboard - Full data access and system management
 */
const AdminDashboard = () => {
  const { getAllEntries } = useData();
  const { getActionStats } = useAudit();
  const [activeTab, setActiveTab] = useState('overview');
  const [storageStats, setStorageStats] = useState(null);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const allEntries = getAllEntries();
  const auditStats = getActionStats();

  const loadStorageStats = () => {
    const stats = storageService.getStorageStats();
    setStorageStats(stats);
  };

  const handleExportBackup = () => {
    const data = storageService.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      if (window.confirm('This will delete all invoices, bills, and audit logs. Continue?')) {
        storageService.clearAll();
        window.location.reload();
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'audit', label: 'Audit Log' },
    { id: 'storage', label: 'Storage' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system settings and view logs</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <StatCardGrid columns={4}>
            <StatCard title="Total Entries" value={allEntries.length} color="primary" />
            <StatCard title="Audit Logs" value={auditStats.total} color="neutral" />
            <StatCard title="Actions Today" value={auditStats.today} color="success" />
            <StatCard title="Actions This Week" value={auditStats.thisWeek} color="warning" />
          </StatCardGrid>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Actions by Type" />
              <div className="space-y-2">
                {Object.entries(auditStats.byAction).map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-600">{action}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Actions by Module" />
              <div className="space-y-2">
                {Object.entries(auditStats.byModule).map(([module, count]) => (
                  <div key={module} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-gray-600">{module}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <AuditLog />
      )}

      {activeTab === 'storage' && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Storage Usage"
              action={
                <Button variant="secondary" size="sm" onClick={loadStorageStats}>
                  Refresh Stats
                </Button>
              }
            />
            {!storageStats ? (
              <p className="text-gray-500">Click "Refresh Stats" to view storage usage</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Data Type</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Items</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(storageStats).filter(([k]) => k !== 'total').map(([key, data]) => (
                      <tr key={key}>
                        <td className="px-4 py-2 text-sm">{key}</td>
                        <td className="px-4 py-2 text-sm text-right">{data.itemCount}</td>
                        <td className="px-4 py-2 text-sm text-right">{data.sizeFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className="px-4 py-2 text-right">{storageStats.total?.sizeFormatted}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Data Management" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Export Backup</h4>
                  <p className="text-sm text-gray-500">Download all data as JSON file</p>
                </div>
                <Button variant="primary" onClick={handleExportBackup}>
                  Export Data
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-700">Clear All Data</h4>
                  <p className="text-sm text-red-600">Permanently delete all data (cannot be undone)</p>
                </div>
                <Button variant="danger" onClick={handleClearAllData}>
                  Clear Data
                </Button>
              </div>
            </div>
          </Card>

          <Alert variant="info" title="System Information">
            <p>App Version: 2.0.0</p>
            <p>Storage: localStorage (browser)</p>
            <p>Data is stored locally in your browser</p>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
