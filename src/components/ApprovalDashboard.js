import React, { useState, useMemo } from 'react';

function ApprovalDashboard({ 
  user, 
  invoices, 
  generalBills, 
  packingMaterials, 
  pettyCash, 
  happyCard, 
  refunds, 
  driveTrackPorter, 
  reviews,
  updateInvoiceStatus,
  updateGeneralBillStatus,
  updatePackingMaterialStatus,
  updatePettyCashStatus,
  updateHappyCardStatus,
  updateRefundStatus,
  updateDriveTrackPorterStatus,
  updateReviewStatus
}) {
  const [selectedModule, setSelectedModule] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending_approval');

  // Combine all entries for approval
  const allEntries = useMemo(() => {
    const entries = [];

    // Add all module entries with type identification
    invoices.forEach(item => entries.push({ ...item, module: 'transport', type: 'Transport Bill', amount: item.invoiceAmount }));
    generalBills.forEach(item => entries.push({ ...item, module: 'general', type: 'General Bill', amount: item.payableAmount }));
    packingMaterials.forEach(item => entries.push({ ...item, module: 'packing', type: 'Packing Material', amount: item.payableAmount }));
    pettyCash.forEach(item => entries.push({ ...item, module: 'petty', type: 'Petty Cash', amount: item.payableAmount }));
    happyCard.forEach(item => entries.push({ ...item, module: 'happy', type: 'Happy Card', amount: item.payableAmount }));
    refunds.forEach(item => entries.push({ ...item, module: 'refunds', type: 'Refund', amount: item.refundAmount }));
    driveTrackPorter.forEach(item => entries.push({ ...item, module: 'drive', type: 'Drive Track/Porter', amount: item.amount }));
    reviews.forEach(item => entries.push({ ...item, module: 'reviews', type: 'Review', amount: item.amount }));

    return entries;
  }, [invoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  // Filter entries based on user role and status
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      // Module filter
      const moduleMatch = selectedModule === 'all' || entry.module === selectedModule;

      // Status filter based on user role
      let statusMatch = false;
      
      if (user.role === 'manager') {
        if (filterStatus === 'pending_approval') {
          statusMatch = entry.managerApproval === 'pending';
        } else if (filterStatus === 'approved') {
          statusMatch = entry.managerApproval === 'approved';
        } else if (filterStatus === 'rejected') {
          statusMatch = entry.managerApproval === 'rejected';
        } else {
          statusMatch = true;
        }
      } else if (user.role === 'accounts') {
        if (filterStatus === 'pending_approval') {
          statusMatch = entry.managerApproval === 'approved' && entry.accountsApproval === 'pending';
        } else if (filterStatus === 'approved') {
          statusMatch = entry.accountsApproval === 'approved';
        } else if (filterStatus === 'rejected') {
          statusMatch = entry.accountsApproval === 'rejected';
        } else if (filterStatus === 'awaiting_payment') {
          statusMatch = entry.accountsApproval === 'approved' && entry.status !== 'closed';
        } else {
          statusMatch = true;
        }
      } else {
        statusMatch = true;
      }

      return moduleMatch && statusMatch;
    });
  }, [allEntries, selectedModule, filterStatus, user.role]);

  // Statistics
  const stats = useMemo(() => {
    const pending = allEntries.filter(entry => {
      if (user.role === 'manager') {
        return entry.managerApproval === 'pending';
      } else if (user.role === 'accounts') {
        return entry.managerApproval === 'approved' && entry.accountsApproval === 'pending';
      }
      return false;
    }).length;

    const approved = allEntries.filter(entry => {
      if (user.role === 'manager') {
        return entry.managerApproval === 'approved';
      } else if (user.role === 'accounts') {
        return entry.accountsApproval === 'approved';
      }
      return false;
    }).length;

    const awaitingPayment = allEntries.filter(entry => 
      entry.accountsApproval === 'approved' && entry.status !== 'closed'
    ).length;

    const totalAmount = filteredEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

    return { pending, approved, awaitingPayment, totalAmount };
  }, [allEntries, filteredEntries, user.role]);

  const handleApproval = (entry, decision, notes = '') => {
    const updateData = { notes };

    if (user.role === 'manager') {
      updateData.managerApproval = decision;
      updateData.managerApprovalDate = new Date().toISOString();
      updateData.managerApprovedBy = user.username;
      
      // If manager approves, entry moves to accounts
      if (decision === 'approved') {
        updateData.status = 'awaiting_accounts_approval';
      } else if (decision === 'rejected') {
        updateData.status = 'rejected';
      }
    } else if (user.role === 'accounts') {
      updateData.accountsApproval = decision;
      updateData.accountsApprovalDate = new Date().toISOString();
      updateData.accountsApprovedBy = user.username;
      
      // If accounts approves, set status to awaiting_payment
      if (decision === 'approved') {
        updateData.status = 'awaiting_payment';
      } else if (decision === 'rejected') {
        updateData.status = 'rejected';
      }
    }

    // Update the appropriate module
    switch (entry.module) {
      case 'transport':
        updateInvoiceStatus(entry.id, updateData);
        break;
      case 'general':
        updateGeneralBillStatus(entry.id, updateData);
        break;
      case 'packing':
        updatePackingMaterialStatus(entry.id, updateData);
        break;
      case 'petty':
        updatePettyCashStatus(entry.id, updateData);
        break;
      case 'happy':
        updateHappyCardStatus(entry.id, updateData);
        break;
      case 'refunds':
        updateRefundStatus(entry.id, updateData);
        break;
      case 'drive':
        updateDriveTrackPorterStatus(entry.id, updateData);
        break;
      case 'reviews':
        updateReviewStatus(entry.id, updateData);
        break;
    }
  };

  const handlePaymentComplete = (entry) => {
    const updateData = { 
      status: 'closed',
      paymentCompletedDate: new Date().toISOString(),
      paymentCompletedBy: user.username
    };

    switch (entry.module) {
      case 'transport':
        updateInvoiceStatus(entry.id, updateData);
        break;
      case 'general':
        updateGeneralBillStatus(entry.id, updateData);
        break;
      case 'packing':
        updatePackingMaterialStatus(entry.id, updateData);
        break;
      case 'petty':
        updatePettyCashStatus(entry.id, updateData);
        break;
      case 'happy':
        updateHappyCardStatus(entry.id, updateData);
        break;
      case 'refunds':
        updateRefundStatus(entry.id, updateData);
        break;
      case 'drive':
        updateDriveTrackPorterStatus(entry.id, updateData);
        break;
      case 'reviews':
        updateReviewStatus(entry.id, updateData);
        break;
    }
  };

  const getStatusDisplay = (entry) => {
    if (user.role === 'manager') {
      return entry.managerApproval || 'pending';
    } else if (user.role === 'accounts') {
      if (entry.managerApproval !== 'approved') {
        return 'Awaiting Manager';
      }
      return entry.accountsApproval || 'pending';
    }
    return entry.status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'rejected': return 'badge-declined';
      case 'Awaiting Manager': return 'badge-pending';
      case 'awaiting_accounts_approval': return 'badge-pending';
      case 'awaiting_payment': return 'badge-approved';
      case 'closed': return 'badge-approved';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="approval-dashboard">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h2>{user.role === 'manager' ? 'Manager Approval Dashboard' : 'Accounts Approval Dashboard'}</h2>
          <div className="approval-stats">
            <span className="stat-item">
              <strong>Pending: </strong>
              <span className="badge badge-pending">{stats.pending}</span>
            </span>
            <span className="stat-item">
              <strong>Approved: </strong>
              <span className="badge badge-approved">{stats.approved}</span>
            </span>
            {user.role === 'accounts' && (
              <span className="stat-item">
                <strong>Awaiting Payment: </strong>
                <span className="badge badge-approved">{stats.awaitingPayment}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="filter-section">
          <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
            <option value="all">All Modules</option>
            <option value="transport">Transport Bills</option>
            <option value="general">General Bills</option>
            <option value="packing">Packing Materials</option>
            <option value="petty">Petty Cash</option>
            <option value="happy">Happy Card</option>
            <option value="refunds">Refunds</option>
            <option value="drive">Drive Track/Porter</option>
            <option value="reviews">Reviews</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="pending_approval">
              {user.role === 'manager' ? 'Pending Manager Approval' : 'Pending Accounts Approval'}
            </option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            {user.role === 'accounts' && <option value="awaiting_payment">Awaiting Payment</option>}
            <option value="all">All Status</option>
          </select>

          <div className="filter-summary">
            <strong>Total Amount: ₹{stats.totalAmount.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="card">
        <div className="card-header">
          <h2>Approval Queue ({filteredEntries.length} items)</h2>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <h3>No items for approval</h3>
            <p>All items in the selected filter have been processed.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={`${entry.module}-${entry.id}`}>
                    <td>
                      <span className="badge badge-approved">{entry.type}</span>
                    </td>
                    <td>
                      <div>
                        <strong>
                          {entry.vendorName || entry.customerId || entry.name || entry.particulars || 'N/A'}
                        </strong>
                        <br />
                        <small>
                          {entry.invoiceNumber || entry.invoiceNo || entry.description || entry.city || '-'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: entry.module === 'refunds' ? '#dc3545' : '#28a745' }}>
                        ₹{entry.amount?.toLocaleString('en-IN') || '0'}
                      </strong>
                    </td>
                    <td>
                      {entry.invoiceDate || entry.date || entry.uploaded || '-'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(getStatusDisplay(entry))}`}>
                        {getStatusDisplay(entry)}
                      </span>
                    </td>
                    <td>
                      <div className="approval-actions">
                        {((user.role === 'manager' && entry.managerApproval === 'pending') ||
                          (user.role === 'accounts' && entry.managerApproval === 'approved' && entry.accountsApproval === 'pending')) && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApproval(entry, 'approved')}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleApproval(entry, 'rejected')}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        
                        {user.role === 'accounts' && 
                         entry.accountsApproval === 'approved' && 
                         entry.status !== 'closed' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePaymentComplete(entry)}
                          >
                            💰 Mark Paid & Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalDashboard;