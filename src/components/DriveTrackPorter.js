import React, { useState, useMemo } from 'react';

function DriveTrackPorter({ entries, addEntry }) {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    particulars: '',
    month: '',
    amount: '',
    uploaded: '',
    paymentStatus: 'Payment done',
    paymentMode: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const entryData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0
    };

    if (editingEntry) {
      setSuccessMessage('Entry updated successfully!');
    } else {
      addEntry(entryData);
      setSuccessMessage('Entry submitted successfully!');
    }

    // Reset form
    setFormData({
      particulars: '',
      month: '',
      amount: '',
      uploaded: '',
      paymentStatus: 'Payment done',
      paymentMode: ''
    });

    setShowForm(false);
    setEditingEntry(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (entry) => {
    setFormData({
      particulars: entry.particulars || '',
      month: entry.month || '',
      amount: entry.amount?.toString() || '',
      uploaded: entry.uploaded || '',
      paymentStatus: entry.paymentStatus || 'Payment done',
      paymentMode: entry.paymentMode || ''
    });
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      particulars: '',
      month: '',
      amount: '',
      uploaded: '',
      paymentStatus: 'Payment done',
      paymentMode: ''
    });
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: entries.reduce((sum, entry) => sum + (entry.amount || 0), 0),
    totalEntries: entries.length,
    driveTrackEntries: entries.filter(entry => entry.particulars === 'Drive track').length,
    porterEntries: entries.filter(entry => entry.particulars === 'Porter').length,
    creditCardPayments: entries.filter(entry => entry.paymentMode === 'Credit card').length,
    idfcPayments: entries.filter(entry => entry.paymentMode === 'IDFC').length
  }), [entries]);

  // Get unique months for filtering
  const availableMonths = useMemo(() => {
    const months = new Set();
    entries.forEach(entry => {
      if (entry.month) months.add(entry.month);
    });
    return Array.from(months).sort();
  }, [entries]);

  const monthOptions = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="drive-track-porter">
      <div className="card">
        <div className="card-header">
          <h2>{editingEntry ? 'Edit Entry' : 'Submit New Entry'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Entry
            </button>
          )}
        </div>

        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Particulars *</label>
                <select
                  name="particulars"
                  value={formData.particulars}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select particulars</option>
                  <option value="Drive track">Drive track</option>
                  <option value="Porter">Porter</option>
                </select>
              </div>
              <div className="form-group">
                <label>Month *</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select month</option>
                  {monthOptions.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount ($) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder={formData.particulars === 'Drive track' ? '50000' : '20000'}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Mode *</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select payment mode</option>
                  <option value="Credit card">Credit card</option>
                  <option value="IDFC">IDFC</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Uploaded Date</label>
                <input
                  type="date"
                  name="uploaded"
                  value={formData.uploaded}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Payment Status</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                >
                  <option value="Payment done">Payment done</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingEntry ? 'Update Entry' : 'Submit Entry'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Summary Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{stats.totalEntries}</div>
            <div className="stat-label">Total Entries</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.driveTrackEntries}</div>
            <div className="stat-label">Drive Track</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.porterEntries}</div>
            <div className="stat-label">Porter</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">${stats.totalAmount.toFixed(2)}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Drive Track & Porter Payments</h2>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <h3>No entries submitted yet</h3>
            <p>Click "New Entry" to submit your first entry.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Uploaded</th>
                  <th>Payment Status</th>
                  <th>Payment Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className={`badge ${entry.particulars === 'Drive track' ? 'badge-approved' : 'badge-pending'}`}>
                        {entry.particulars}
                      </span>
                    </td>
                    <td><strong>{entry.month}</strong></td>
                    <td style={{
                      backgroundColor: entry.particulars === 'Drive track' ? '#e8f5e8' : '#fff3cd',
                      fontWeight: 'bold',
                      color: entry.particulars === 'Drive track' ? '#28a745' : '#856404'
                    }}>
                      ${entry.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td>{entry.uploaded || '-'}</td>
                    <td>
                      <span className={`badge ${entry.paymentStatus === 'Payment done' ? 'badge-approved' : 'badge-pending'}`}>
                        {entry.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${entry.paymentMode === 'Credit card' ? 'badge-approved' : 'badge-declined'}`}>
                        {entry.paymentMode}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(entry)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Mode Analytics */}
      {entries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Payment Mode Analytics</h2>
          </div>

          <div className="analytics-summary">
            <div className="summary-card total">
              <div className="summary-icon">💳</div>
              <span className="summary-value">{stats.creditCardPayments}</span>
              <span className="summary-label">Credit Card</span>
            </div>
            <div className="summary-card profit-summary">
              <div className="summary-icon">🏦</div>
              <span className="summary-value">{stats.idfcPayments}</span>
              <span className="summary-label">IDFC Bank</span>
            </div>
            <div className="summary-card loss-summary">
              <div className="summary-icon">📊</div>
              <span className="summary-value">${stats.totalAmount.toFixed(2)}</span>
              <span className="summary-label">Total Payments</span>
            </div>
          </div>

          <div className="vendor-analytics">
            <div className="vendor-card profit-card">
              <div className="vendor-card-header">
                <div className="vendor-info">
                  <span className="vendor-name">Drive Track</span>
                  <span className="vendor-count">{stats.driveTrackEntries} payment(s)</span>
                </div>
                <div className="vendor-amount-badge">
                  <span className="vendor-pl-amount profit">
                    ${(stats.driveTrackEntries * 50000).toFixed(2)}
                  </span>
                  <span className="vendor-pl-label">Total Amount</span>
                </div>
              </div>
            </div>

            <div className="vendor-card loss-card">
              <div className="vendor-card-header">
                <div className="vendor-info">
                  <span className="vendor-name">Porter</span>
                  <span className="vendor-count">{stats.porterEntries} payment(s)</span>
                </div>
                <div className="vendor-amount-badge">
                  <span className="vendor-pl-amount loss">
                    ${(stats.porterEntries * 20000).toFixed(2)}
                  </span>
                  <span className="vendor-pl-label">Total Amount</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriveTrackPorter;