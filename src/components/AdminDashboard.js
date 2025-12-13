import React, { useState, useMemo } from 'react';

function AdminDashboard({ invoices, updateInvoiceStatus, updateInvoice }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', adminNotes: '' });

  // Get unique months from invoices
  const availableMonths = useMemo(() => {
    const months = new Set();
    invoices.forEach(inv => {
      if (inv.invoiceDate) {
        const date = new Date(inv.invoiceDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
      }
    });
    return Array.from(months).sort().reverse();
  }, [invoices]);

  // Get unique cities from invoices
  const availableCities = useMemo(() => {
    const cities = new Set();
    invoices.forEach(inv => {
      if (inv.city) cities.add(inv.city);
    });
    return Array.from(cities).sort();
  }, [invoices]);

  // Get unique vendors from invoices
  const availableVendors = useMemo(() => {
    const vendors = new Set();
    invoices.forEach(inv => {
      if (inv.vendorName) vendors.add(inv.vendorName);
    });
    return Array.from(vendors).sort();
  }, [invoices]);

  // Filter invoices based on status, month, city, and vendor
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const statusMatch = filterStatus === 'all' || inv.status === filterStatus;

      // Month filter
      let monthMatch = true;
      if (filterMonth !== 'all' && inv.invoiceDate) {
        const date = new Date(inv.invoiceDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthMatch = monthYear === filterMonth;
      } else if (filterMonth !== 'all' && !inv.invoiceDate) {
        monthMatch = false;
      }

      // City filter
      const cityMatch = filterCity === 'all' || inv.city === filterCity;

      // Vendor filter
      const vendorMatch = filterVendor === 'all' || inv.vendorName === filterVendor;

      return statusMatch && monthMatch && cityMatch && vendorMatch;
    });
  }, [invoices, filterStatus, filterMonth, filterCity, filterVendor]);

  // Calculate statistics based on filtered invoices
  const stats = useMemo(() => {
    const total = filteredInvoices.length;
    const pending = filteredInvoices.filter(inv => inv.status === 'pending').length;
    const approved = filteredInvoices.filter(inv => inv.status === 'approved').length;
    const declined = filteredInvoices.filter(inv => inv.status === 'declined').length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0);
    const totalPL = filteredInvoices.reduce((sum, inv) => sum + (inv.profitLoss || 0), 0);
    const totalPacking = filteredInvoices.reduce((sum, inv) => sum + (inv.packingMaterial || 0), 0);
    const totalReceived = filteredInvoices.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);
    const avgPL = total > 0 ? totalPL / total : 0;
    const profitableCount = filteredInvoices.filter(inv => (inv.profitLoss || 0) > 0).length;
    const lossCount = filteredInvoices.filter(inv => (inv.profitLoss || 0) < 0).length;
    const uniqueVendors = new Set(filteredInvoices.map(inv => inv.vendorName)).size;
    const uniqueCities = new Set(filteredInvoices.map(inv => inv.city)).size;

    return {
      total,
      pending,
      approved,
      declined,
      totalAmount,
      totalPL,
      totalPacking,
      totalReceived,
      avgPL,
      profitableCount,
      lossCount,
      uniqueVendors,
      uniqueCities
    };
  }, [filteredInvoices]);

  // Calculate vendor-wise P/L for analytics
  const vendorAnalytics = useMemo(() => {
    const vendorMap = {};
    filteredInvoices.forEach(inv => {
      if (inv.vendorName) {
        if (!vendorMap[inv.vendorName]) {
          vendorMap[inv.vendorName] = { totalPL: 0, totalAmount: 0, totalPacking: 0, totalReceived: 0, count: 0 };
        }
        vendorMap[inv.vendorName].totalPL += inv.profitLoss || 0;
        vendorMap[inv.vendorName].totalAmount += inv.invoiceAmount || 0;
        vendorMap[inv.vendorName].totalPacking += inv.packingMaterial || 0;
        vendorMap[inv.vendorName].totalReceived += inv.receivedAmount || 0;
        vendorMap[inv.vendorName].count += 1;
      }
    });

    return Object.entries(vendorMap)
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.totalPL - a.totalPL);
  }, [filteredInvoices]);

  // Find max value for scaling the bar chart
  const maxPL = useMemo(() => {
    if (vendorAnalytics.length === 0) return 0;
    return Math.max(...vendorAnalytics.map(v => Math.abs(v.totalPL)));
  }, [vendorAnalytics]);

  const handleApprove = (id) => {
    updateInvoiceStatus(id, 'approved');
  };

  const handleDecline = (id) => {
    updateInvoiceStatus(id, 'declined');
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setEditForm({
      status: invoice.status,
      adminNotes: invoice.adminNotes || ''
    });
  };

  const handleEditSave = () => {
    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        status: editForm.status,
        adminNotes: editForm.adminNotes
      });
      setEditingInvoice(null);
      setEditForm({ status: '', adminNotes: '' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonthLabel = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="admin-dashboard">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card declined">
          <div className="stat-number">{stats.declined}</div>
          <div className="stat-label">Declined</div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h2>Financial Overview</h2>
        </div>
        <div className="financial-stats-grid">
          <div className="financial-stat-item">
            <span className="financial-stat-value" style={{ color: '#1e3c72' }}>
              ${stats.totalPacking.toFixed(2)}
            </span>
            <span className="financial-stat-label">Total Packing Material</span>
          </div>
          <div className="financial-stat-item">
            <span className="financial-stat-value" style={{ color: '#17a2b8' }}>
              ${stats.totalReceived.toFixed(2)}
            </span>
            <span className="financial-stat-label">Total Received</span>
          </div>
          <div className="financial-stat-item">
            <span className="financial-stat-value" style={{ color: '#6c5ce7' }}>
              ${stats.totalAmount.toFixed(2)}
            </span>
            <span className="financial-stat-label">Total Invoice Amount</span>
          </div>
          <div className="financial-stat-item">
            <span className={`financial-stat-value ${stats.totalPL >= 0 ? 'profit' : 'loss'}`}>
              {stats.totalPL >= 0 ? '+' : ''}${stats.totalPL.toFixed(2)}
            </span>
            <span className="financial-stat-label">Net Profit/Loss</span>
          </div>
          <div className="financial-stat-item">
            <span className={`financial-stat-value ${stats.avgPL >= 0 ? 'profit' : 'loss'}`}>
              {stats.avgPL >= 0 ? '+' : ''}${stats.avgPL.toFixed(2)}
            </span>
            <span className="financial-stat-label">Avg P/L per Invoice</span>
          </div>
          <div className="financial-stat-item">
            <span className="financial-stat-value profit">{stats.profitableCount}</span>
            <span className="financial-stat-label">Profitable Invoices</span>
          </div>
          <div className="financial-stat-item">
            <span className="financial-stat-value loss">{stats.lossCount}</span>
            <span className="financial-stat-label">Loss Invoices</span>
          </div>
          <div className="financial-stat-item">
            <span className="financial-stat-value" style={{ color: '#fd7e14' }}>{stats.uniqueVendors}</span>
            <span className="financial-stat-label">Unique Vendors</span>
          </div>
          <div className="financial-stat-item">
            <span className="financial-stat-value" style={{ color: '#20c997' }}>{stats.uniqueCities}</span>
            <span className="financial-stat-label">Unique Cities</span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-header">
          <h2>Invoice Requests</h2>
        </div>
        <div className="filter-section" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="all">All Cities</option>
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
          >
            <option value="all">All Vendors</option>
            {availableVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
          {(filterMonth !== 'all' || filterCity !== 'all' || filterVendor !== 'all' || filterStatus !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilterMonth('all');
                setFilterCity('all');
                setFilterVendor('all');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices found</h3>
            <p>There are no invoices matching your filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>City</th>
                  <th>Packing</th>
                  <th>Received</th>
                  <th>Amount</th>
                  <th>P/L</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoiceNumber}</strong></td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{invoice.vendorName}</td>
                    <td>{invoice.city}</td>
                    <td>${invoice.packingMaterial?.toFixed(2) || '0.00'}</td>
                    <td>${invoice.receivedAmount?.toFixed(2) || '0.00'}</td>
                    <td>${invoice.invoiceAmount?.toFixed(2) || '0.00'}</td>
                    <td className={invoice.profitLoss >= 0 ? 'profit' : 'loss'}>
                      {invoice.profitLoss >= 0 ? '+' : ''}{invoice.profitLoss?.toFixed(2) || '0.00'}
                    </td>
                    <td>
                      <span className={`badge badge-${invoice.status}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="notes-cell">
                      {invoice.adminNotes ? (
                        <span className="notes-preview" title={invoice.adminNotes}>
                          {invoice.adminNotes.length > 20
                            ? invoice.adminNotes.substring(0, 20) + '...'
                            : invoice.adminNotes}
                        </span>
                      ) : (
                        <span className="no-notes">-</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openEditModal(invoice)}
                        >
                          Edit
                        </button>
                        {invoice.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(invoice.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDecline(invoice.id)}
                            >
                              Decline
                            </button>
                          </>
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

      {/* Vendor-wise P/L Analytics */}
      {vendorAnalytics.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Vendor-wise P/L Analytics</h2>
            {filterMonth !== 'all' && (
              <span className="filter-badge">{formatMonthLabel(filterMonth)}</span>
            )}
          </div>

          <div className="vendor-analytics">
            {vendorAnalytics.map((vendor, index) => (
              <div key={index} className={`vendor-card ${vendor.totalPL >= 0 ? 'profit-card' : 'loss-card'}`}>
                <div className="vendor-card-header">
                  <div className="vendor-info">
                    <span className="vendor-name">{vendor.vendor}</span>
                    <span className="vendor-count">{vendor.count} invoice(s)</span>
                  </div>
                  <div className="vendor-amount-badge">
                    <span className={`vendor-pl-amount ${vendor.totalPL >= 0 ? 'profit' : 'loss'}`}>
                      {vendor.totalPL >= 0 ? '+' : ''}${Math.abs(vendor.totalPL).toFixed(2)}
                    </span>
                    <span className="vendor-pl-label">{vendor.totalPL >= 0 ? 'Profit' : 'Loss'}</span>
                  </div>
                </div>
                <div className="bar-wrapper">
                  <div className="bar-container">
                    <div
                      className={`bar ${vendor.totalPL >= 0 ? 'bar-profit' : 'bar-loss'}`}
                      style={{
                        width: maxPL > 0 ? `${(Math.abs(vendor.totalPL) / maxPL) * 100}%` : '0%',
                        minWidth: '30px'
                      }}
                    />
                  </div>
                </div>
                <div className="vendor-details">
                  <div className="vendor-detail-item">
                    <span className="vendor-detail-value">${vendor.totalPacking.toFixed(2)}</span>
                    <span className="vendor-detail-label">Packing Used</span>
                  </div>
                  <div className="vendor-detail-item">
                    <span className="vendor-detail-value">${vendor.totalReceived.toFixed(2)}</span>
                    <span className="vendor-detail-label">Received</span>
                  </div>
                  <div className="vendor-detail-item">
                    <span className="vendor-detail-value">${vendor.totalAmount.toFixed(2)}</span>
                    <span className="vendor-detail-label">Total Amount</span>
                  </div>
                  <div className="vendor-detail-item">
                    <span className={`vendor-detail-value ${vendor.totalPL >= 0 ? 'profit' : 'loss'}`}>
                      {vendor.totalPL >= 0 ? '+' : ''}{vendor.totalPL.toFixed(2)}
                    </span>
                    <span className="vendor-detail-label">Net P/L</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="analytics-summary">
            <div className="summary-card total">
              <div className="summary-icon">📊</div>
              <span className="summary-value">{vendorAnalytics.length}</span>
              <span className="summary-label">Total Vendors</span>
            </div>
            <div className="summary-card profit-summary">
              <div className="summary-icon">📈</div>
              <span className="summary-value">{vendorAnalytics.filter(v => v.totalPL > 0).length}</span>
              <span className="summary-label">Profitable</span>
            </div>
            <div className="summary-card loss-summary">
              <div className="summary-icon">📉</div>
              <span className="summary-value">{vendorAnalytics.filter(v => v.totalPL < 0).length}</span>
              <span className="summary-label">Loss-making</span>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Invoice Details - {selectedInvoice.invoiceNumber}</h3>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Invoice Number:</strong> {selectedInvoice.invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> {formatDate(selectedInvoice.invoiceDate)}</p>
              <p><strong>Vendor Name:</strong> {selectedInvoice.vendorName}</p>
              <p><strong>City:</strong> {selectedInvoice.city}</p>
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />
              <p><strong>Packing Material:</strong> ${selectedInvoice.packingMaterial?.toFixed(2) || '0.00'}</p>
              <p><strong>Received from Customer:</strong> ${selectedInvoice.receivedAmount?.toFixed(2) || '0.00'}</p>
              <p><strong>Invoice Amount:</strong> ${selectedInvoice.invoiceAmount?.toFixed(2)}</p>
              <p><strong>P/L:</strong> <span className={selectedInvoice.profitLoss >= 0 ? 'profit' : 'loss'}>{selectedInvoice.profitLoss >= 0 ? '+' : ''}{selectedInvoice.profitLoss?.toFixed(2)}</span></p>
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />
              <p><strong>User Remarks:</strong> {selectedInvoice.remarks || 'N/A'}</p>
              <p><strong>Admin Notes:</strong> {selectedInvoice.adminNotes || 'N/A'}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`badge badge-${selectedInvoice.status}`}>
                  {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                </span>
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  openEditModal(selectedInvoice);
                  setSelectedInvoice(null);
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingInvoice && (
        <div className="modal-overlay" onClick={() => setEditingInvoice(null)}>
          <div className="modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Invoice - {editingInvoice.invoiceNumber}</h3>
            <div className="edit-form">
              <div className="form-group">
                <label>Current Status</label>
                <div className="current-status">
                  <span className={`badge badge-${editingInvoice.status}`}>
                    {editingInvoice.status.charAt(0).toUpperCase() + editingInvoice.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Change Status To</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                  placeholder="Add notes about this invoice..."
                  rows={4}
                />
              </div>

              <div className="invoice-summary">
                <h4>Invoice Summary</h4>
                <p><strong>Vendor:</strong> {editingInvoice.vendorName}</p>
                <p><strong>City:</strong> {editingInvoice.city}</p>
                <p><strong>Amount:</strong> ${editingInvoice.invoiceAmount?.toFixed(2)}</p>
                <p><strong>P/L:</strong> <span className={editingInvoice.profitLoss >= 0 ? 'profit' : 'loss'}>{editingInvoice.profitLoss >= 0 ? '+' : ''}${editingInvoice.profitLoss?.toFixed(2)}</span></p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingInvoice(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
