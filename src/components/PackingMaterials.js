import React, { useState, useMemo } from 'react';

function PackingMaterials({ materials, addMaterial }) {
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    invoiceDate: '',
    month: '',
    vendorName: '',
    payableAmount: '',
    dueDate: '',
    submissionStatus: 'Submitted accounts',
    city: '',
    paymentStatus: 'pending for approval',
    bankStatus: 'cashfree',
    uploadedDate: '',
    approvedBy: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const materialData = {
      ...formData,
      payableAmount: parseFloat(formData.payableAmount) || 0
    };

    if (editingMaterial) {
      setSuccessMessage('Packing material updated successfully!');
    } else {
      addMaterial(materialData);
      setSuccessMessage('Packing material submitted successfully!');
    }

    // Reset form
    setFormData({
      invoiceDate: '',
      month: '',
      vendorName: '',
      payableAmount: '',
      dueDate: '',
      submissionStatus: 'Submitted accounts',
      city: '',
      paymentStatus: 'pending for approval',
      bankStatus: 'cashfree',
      uploadedDate: '',
      approvedBy: ''
    });

    setShowForm(false);
    setEditingMaterial(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (material) => {
    setFormData({
      invoiceDate: material.invoiceDate || '',
      month: material.month || '',
      vendorName: material.vendorName || '',
      payableAmount: material.payableAmount?.toString() || '',
      dueDate: material.dueDate || '',
      submissionStatus: material.submissionStatus || 'Submitted accounts',
      city: material.city || '',
      paymentStatus: material.paymentStatus || 'pending for approval',
      bankStatus: material.bankStatus || 'cashfree',
      uploadedDate: material.uploadedDate || '',
      approvedBy: material.approvedBy || ''
    });
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMaterial(null);
    setFormData({
      invoiceDate: '',
      month: '',
      vendorName: '',
      payableAmount: '',
      dueDate: '',
      submissionStatus: 'Submitted accounts',
      city: '',
      paymentStatus: 'pending for approval',
      bankStatus: 'cashfree',
      uploadedDate: '',
      approvedBy: ''
    });
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: materials.reduce((sum, material) => sum + (material.payableAmount || 0), 0),
    totalMaterials: materials.length,
    submittedAccounts: materials.filter(m => m.submissionStatus === 'Submitted accounts').length,
    pendingApproval: materials.filter(m => m.paymentStatus === 'pending for approval').length
  }), [materials]);

  // Get unique cities and vendors for filters
  const availableCities = useMemo(() => {
    const cities = new Set();
    materials.forEach(material => {
      if (material.city) cities.add(material.city);
    });
    return Array.from(cities).sort();
  }, [materials]);

  const availableVendors = useMemo(() => {
    const vendors = new Set();
    materials.forEach(material => {
      if (material.vendorName) vendors.add(material.vendorName);
    });
    return Array.from(vendors).sort();
  }, [materials]);

  return (
    <div className="packing-materials">
      <div className="card">
        <div className="card-header">
          <h2>{editingMaterial ? 'Edit Packing Material' : 'Submit New Packing Material'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Packing Material
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
                <label>Invoice Date *</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  required
                />
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
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Enter city"
                  required
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
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Submission Status</label>
                <select
                  name="submissionStatus"
                  value={formData.submissionStatus}
                  onChange={handleInputChange}
                >
                  <option value="Submitted accounts">Submitted accounts</option>
                  <option value="Full invoice amount">Full invoice amount</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment Status</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                >
                  <option value="pending for approval">Pending for approval</option>
                  <option value="Payment done">Payment done</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bank Status</label>
                <select
                  name="bankStatus"
                  value={formData.bankStatus}
                  onChange={handleInputChange}
                >
                  <option value="cashfree">Cashfree</option>
                  <option value="IDFC">IDFC</option>
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

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingMaterial ? 'Update Material' : 'Submit Material'}
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
            <div className="stat-number">{stats.totalMaterials}</div>
            <div className="stat-label">Total Materials</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.submittedAccounts}</div>
            <div className="stat-label">Submitted Accounts</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pendingApproval}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Packing Materials Bills</h2>
        </div>

        {materials.length === 0 ? (
          <div className="empty-state">
            <h3>No packing materials submitted yet</h3>
            <p>Click "New Packing Material" to submit your first entry.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice Date</th>
                  <th>Month</th>
                  <th>Vendor Name</th>
                  <th>Payable Amount</th>
                  <th>Due Date</th>
                  <th>Submission Status</th>
                  <th>City</th>
                  <th>Payment Status</th>
                  <th>Bank Status</th>
                  <th>Uploaded Date</th>
                  <th>Approved By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>{material.invoiceDate || '-'}</td>
                    <td>{material.month || '-'}</td>
                    <td>{material.vendorName}</td>
                    <td style={{ 
                      backgroundColor: material.payableAmount > 50000 ? '#e8f5e8' : 
                                     material.payableAmount > 20000 ? '#fff3cd' : '#f8f9fa'
                    }}>
                      ₹{material.payableAmount?.toLocaleString('en-IN') || '0'}
                    </td>
                    <td>{material.dueDate || '-'}</td>
                    <td>
                      <span className={`badge ${material.submissionStatus === 'Submitted accounts' ? 'badge-approved' : 'badge-pending'}`}>
                        {material.submissionStatus}
                      </span>
                    </td>
                    <td>{material.city}</td>
                    <td>
                      <span className={`badge ${material.paymentStatus === 'Payment done' ? 'badge-approved' : 'badge-pending'}`}>
                        {material.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${material.bankStatus === 'cashfree' ? 'badge-approved' : 'badge-declined'}`}>
                        {material.bankStatus}
                      </span>
                    </td>
                    <td>{material.uploadedDate || '-'}</td>
                    <td>{material.approvedBy || '-'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(material)}
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

export default PackingMaterials;