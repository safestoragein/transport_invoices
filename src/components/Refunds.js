import React, { useState, useMemo } from 'react';

function Refunds({ refunds, addRefund }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRefund, setEditingRefund] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    customerId: '',
    refundAmount: '',
    description: '',
    refundStatus: 'Processed',
    uploadedDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const refundData = {
      ...formData,
      refundAmount: parseFloat(formData.refundAmount) || 0
    };

    if (editingRefund) {
      setSuccessMessage('Refund updated successfully!');
    } else {
      addRefund(refundData);
      setSuccessMessage('Refund submitted successfully!');
    }

    // Reset form
    setFormData({
      date: '',
      customerId: '',
      refundAmount: '',
      description: '',
      refundStatus: 'Processed',
      uploadedDate: ''
    });

    setShowForm(false);
    setEditingRefund(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (refund) => {
    setFormData({
      date: refund.date || '',
      customerId: refund.customerId || '',
      refundAmount: refund.refundAmount?.toString() || '',
      description: refund.description || '',
      refundStatus: refund.refundStatus || 'Processed',
      uploadedDate: refund.uploadedDate || ''
    });
    setEditingRefund(refund);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRefund(null);
    setFormData({
      date: '',
      customerId: '',
      refundAmount: '',
      description: '',
      refundStatus: 'Processed',
      uploadedDate: ''
    });
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: refunds.reduce((sum, refund) => sum + (refund.refundAmount || 0), 0),
    totalRefunds: refunds.length,
    processedRefunds: refunds.filter(refund => refund.refundStatus === 'Processed').length,
    damageRefunds: refunds.filter(refund => refund.description === 'Damage').length,
    rentalRefunds: refunds.filter(refund => refund.description === 'Rental').length
  }), [refunds]);

  // Get unique descriptions and customer IDs
  const availableDescriptions = useMemo(() => {
    const descriptions = new Set();
    refunds.forEach(refund => {
      if (refund.description) descriptions.add(refund.description);
    });
    return Array.from(descriptions).sort();
  }, [refunds]);

  const descriptionTypes = [
    'Damage',
    'Rental',
    'Damages', 
    'Extra amount',
    'Token advance'
  ];

  return (
    <div className="refunds">
      <div className="card">
        <div className="card-header">
          <h2>{editingRefund ? 'Edit Refund' : 'Submit New Refund'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Refund
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
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Customer ID *</label>
                <input
                  type="text"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  placeholder="Enter customer ID (e.g., MH32643)"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Refund Amount (₹) *</label>
                <input
                  type="number"
                  name="refundAmount"
                  value={formData.refundAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <select
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select description</option>
                  {descriptionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Refund Status</label>
                <select
                  name="refundStatus"
                  value={formData.refundStatus}
                  onChange={handleInputChange}
                >
                  <option value="Processed">Processed</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label>Uploaded Date</label>
                <input
                  type="date"
                  name="uploadedDate"
                  value={formData.uploadedDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingRefund ? 'Update Refund' : 'Submit Refund'}
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
            <div className="stat-number">{stats.totalRefunds}</div>
            <div className="stat-label">Total Refunds</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.processedRefunds}</div>
            <div className="stat-label">Processed</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.damageRefunds}</div>
            <div className="stat-label">Damage Refunds</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Customer Refunds</h2>
        </div>

        {refunds.length === 0 ? (
          <div className="empty-state">
            <h3>No refunds submitted yet</h3>
            <p>Click "New Refund" to submit your first refund.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Customer ID</th>
                  <th>Refund Amount</th>
                  <th>Description</th>
                  <th>Refund Status</th>
                  <th>Uploaded Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund, index) => (
                  <tr key={refund.id}>
                    <td>{index + 1}</td>
                    <td>{refund.date}</td>
                    <td><strong>{refund.customerId}</strong></td>
                    <td style={{
                      backgroundColor: refund.refundAmount > 5000 ? '#e8f5e8' : 
                                     refund.refundAmount > 1000 ? '#fff3cd' : '#f8f9fa',
                      fontWeight: 'bold'
                    }}>
                      ₹{refund.refundAmount?.toLocaleString('en-IN') || '0'}
                    </td>
                    <td>
                      <span className={`badge ${
                        refund.description === 'Damage' ? 'badge-declined' :
                        refund.description === 'Rental' ? 'badge-pending' :
                        'badge-approved'
                      }`}>
                        {refund.description}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${refund.refundStatus === 'Processed' ? 'badge-approved' : refund.refundStatus === 'Pending' ? 'badge-pending' : 'badge-declined'}`}>
                        {refund.refundStatus}
                      </span>
                    </td>
                    <td>{refund.uploadedDate || '-'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(refund)}
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

      {/* Refund Analytics */}
      {refunds.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Refund Analytics</h2>
          </div>

          <div className="analytics-summary">
            <div className="summary-card loss-summary">
              <div className="summary-icon">💰</div>
              <span className="summary-value">₹{stats.totalAmount.toLocaleString('en-IN')}</span>
              <span className="summary-label">Total Refunded</span>
            </div>
            <div className="summary-card total">
              <div className="summary-icon">📊</div>
              <span className="summary-value">{stats.damageRefunds}</span>
              <span className="summary-label">Damage Claims</span>
            </div>
            <div className="summary-card profit-summary">
              <div className="summary-icon">🏠</div>
              <span className="summary-value">{stats.rentalRefunds}</span>
              <span className="summary-label">Rental Refunds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Refunds;