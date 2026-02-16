import React, { useState, useMemo } from 'react';

function PettyCash({ cash, addCash }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCash, setEditingCash] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    vendorName: '',
    invoiceNo: '',
    description: '',
    month: '',
    payableAmount: '',
    remarks: '',
    paymentStatus: 'Payment done',
    uploadedDate: '',
    approvedBy: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cashData = {
      ...formData,
      payableAmount: parseFloat(formData.payableAmount) || 0
    };

    if (editingCash) {
      setSuccessMessage('Petty cash updated successfully!');
    } else {
      addCash(cashData);
      setSuccessMessage('Petty cash submitted successfully!');
    }

    // Reset form
    setFormData({
      vendorName: '',
      invoiceNo: '',
      description: '',
      month: '',
      payableAmount: '',
      remarks: '',
      paymentStatus: 'Payment done',
      uploadedDate: '',
      approvedBy: ''
    });

    setShowForm(false);
    setEditingCash(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (cashEntry) => {
    setFormData({
      vendorName: cashEntry.vendorName || '',
      invoiceNo: cashEntry.invoiceNo || '',
      description: cashEntry.description || '',
      month: cashEntry.month || '',
      payableAmount: cashEntry.payableAmount?.toString() || '',
      remarks: cashEntry.remarks || '',
      paymentStatus: cashEntry.paymentStatus || 'Payment done',
      uploadedDate: cashEntry.uploadedDate || '',
      approvedBy: cashEntry.approvedBy || ''
    });
    setEditingCash(cashEntry);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCash(null);
    setFormData({
      vendorName: '',
      invoiceNo: '',
      description: '',
      month: '',
      payableAmount: '',
      remarks: '',
      paymentStatus: 'Payment done',
      uploadedDate: '',
      approvedBy: ''
    });
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: cash.reduce((sum, entry) => sum + (entry.payableAmount || 0), 0),
    totalEntries: cash.length,
    paidEntries: cash.filter(entry => entry.paymentStatus === 'Payment done').length,
    companyExpenses: cash.filter(entry => entry.description === 'Company expenses').length
  }), [cash]);

  // Get unique vendors and description types
  const availableVendors = useMemo(() => {
    const vendors = new Set();
    cash.forEach(entry => {
      if (entry.vendorName) vendors.add(entry.vendorName);
    });
    return Array.from(vendors).sort();
  }, [cash]);

  const expenseTypes = [
    'Company expenses',
    'Transport',
    'Groceries',
    'Petty cash',
    'SGH', 
    'Vegetables',
    'Canteen expenses'
  ];

  return (
    <div className="petty-cash">
      <div className="card">
        <div className="card-header">
          <h2>{editingCash ? 'Edit Petty Cash' : 'Submit New Petty Cash'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Petty Cash
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
                <label>Vendor Name *</label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleInputChange}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Invoice No</label>
                <input
                  type="text"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                  placeholder="Enter invoice number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Description *</label>
                <select
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select description</option>
                  {expenseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Month</label>
                <input
                  type="text"
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  placeholder="Enter month"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Payable Amount (₹) *</label>
                <input
                  type="number"
                  name="payableAmount"
                  value={formData.payableAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
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

            <div className="form-row">
              <div className="form-group">
                <label>Uploaded Date</label>
                <input
                  type="date"
                  name="uploadedDate"
                  value={formData.uploadedDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Approved By</label>
                <input
                  type="text"
                  name="approvedBy"
                  value={formData.approvedBy}
                  onChange={handleInputChange}
                  placeholder="Enter approver name"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter any remarks..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingCash ? 'Update Entry' : 'Submit Entry'}
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
            <div className="stat-number">{stats.paidEntries}</div>
            <div className="stat-label">Paid Entries</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.companyExpenses}</div>
            <div className="stat-label">Company Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Petty Cash Bills</h2>
        </div>

        {cash.length === 0 ? (
          <div className="empty-state">
            <h3>No petty cash entries submitted yet</h3>
            <p>Click "New Petty Cash" to submit your first entry.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Invoice No</th>
                  <th>Description</th>
                  <th>Month</th>
                  <th>Payable Amount</th>
                  <th>Remarks</th>
                  <th>Payment Status</th>
                  <th>Uploaded Date</th>
                  <th>Approved By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cash.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.vendorName}</td>
                    <td><strong>{entry.invoiceNo || '-'}</strong></td>
                    <td>
                      <span className={`badge ${entry.description === 'Company expenses' ? 'badge-approved' : 'badge-pending'}`}>
                        {entry.description}
                      </span>
                    </td>
                    <td>{entry.month || '-'}</td>
                    <td>₹{entry.payableAmount?.toLocaleString('en-IN') || '0'}</td>
                    <td>{entry.remarks || '-'}</td>
                    <td>
                      <span className={`badge ${entry.paymentStatus === 'Payment done' ? 'badge-approved' : 'badge-pending'}`}>
                        {entry.paymentStatus}
                      </span>
                    </td>
                    <td>{entry.uploadedDate || '-'}</td>
                    <td>{entry.approvedBy || '-'}</td>
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
    </div>
  );
}

export default PettyCash;