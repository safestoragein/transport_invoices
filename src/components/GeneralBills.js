import React, { useState, useMemo } from 'react';

function GeneralBills({ bills, addBill }) {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [formData, setFormData] = useState({
    vendorName: '',
    invoiceNo: '',
    invoiceDate: '',
    month: '',
    payableAmount: '',
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

    const billData = {
      ...formData,
      payableAmount: parseFloat(formData.payableAmount) || 0
    };

    if (editingBill) {
      setSuccessMessage('General bill updated successfully!');
    } else {
      addBill(billData);
      setSuccessMessage('General bill submitted successfully!');
    }

    // Reset form
    setFormData({
      vendorName: '',
      invoiceNo: '',
      invoiceDate: '',
      month: '',
      payableAmount: '',
      paymentStatus: 'Payment done',
      uploadedDate: '',
      approvedBy: ''
    });

    setShowForm(false);
    setEditingBill(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (bill) => {
    setFormData({
      vendorName: bill.vendorName || '',
      invoiceNo: bill.invoiceNo || '',
      invoiceDate: bill.invoiceDate || '',
      month: bill.month || '',
      payableAmount: bill.payableAmount?.toString() || '',
      paymentStatus: bill.paymentStatus || 'Payment done',
      uploadedDate: bill.uploadedDate || '',
      approvedBy: bill.approvedBy || ''
    });
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBill(null);
    setFormData({
      vendorName: '',
      invoiceNo: '',
      invoiceDate: '',
      month: '',
      payableAmount: '',
      paymentStatus: 'Payment done',
      uploadedDate: '',
      approvedBy: ''
    });
  };

  // Filter bills based on selected filters
  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const matchesVendor = !filterVendor || (bill.vendorName && bill.vendorName.toLowerCase().includes(filterVendor.toLowerCase()));
      const matchesStatus = !filterStatus || bill.paymentStatus === filterStatus;
      const matchesMonth = !filterMonth || bill.month === filterMonth;
      return matchesVendor && matchesStatus && matchesMonth;
    });
  }, [bills, filterVendor, filterStatus, filterMonth]);

  // Get unique vendors, statuses, and months for filters  
  // const uniqueVendors = useMemo(() => [...new Set(bills.map(bill => bill.vendorName).filter(Boolean))].sort(), [bills]);
  const uniqueStatuses = useMemo(() => [...new Set(bills.map(bill => bill.paymentStatus).filter(Boolean))].sort(), [bills]);
  const uniqueMonths = useMemo(() => [...new Set(bills.map(bill => bill.month).filter(Boolean))].sort(), [bills]);

  // Calculate statistics for filtered bills
  const stats = useMemo(() => ({
    totalAmount: filteredBills.reduce((sum, bill) => sum + (bill.payableAmount || 0), 0),
    totalBills: filteredBills.length,
    paidBills: filteredBills.filter(bill => bill.paymentStatus === 'Payment done').length,
    pendingBills: filteredBills.filter(bill => bill.paymentStatus !== 'Payment done').length,
    uniqueVendorsCount: new Set(filteredBills.map(bill => bill.vendorName)).size
  }), [filteredBills]);

  // Vendor summary
  const vendorSummary = useMemo(() => {
    const summary = {};
    filteredBills.forEach(bill => {
      const vendor = bill.vendorName;
      if (!summary[vendor]) {
        summary[vendor] = {
          totalAmount: 0,
          billCount: 0,
          paidAmount: 0,
          pendingAmount: 0
        };
      }
      summary[vendor].totalAmount += bill.payableAmount || 0;
      summary[vendor].billCount += 1;
      if (bill.paymentStatus === 'Payment done') {
        summary[vendor].paidAmount += bill.payableAmount || 0;
      } else {
        summary[vendor].pendingAmount += bill.payableAmount || 0;
      }
    });
    
    return Object.entries(summary)
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredBills]);

  return (
    <div className="general-bills">
      <div className="card">
        <div className="card-header">
          <h2>{editingBill ? 'Edit General Bill' : 'Submit New General Bill'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New General Bill
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
                <label>Invoice No *</label>
                <input
                  type="text"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                  placeholder="Enter invoice number"
                  required
                />
              </div>
            </div>

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
                  <option value="Hold">Hold</option>
                  <option value="partially pending">Partially pending</option>
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

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingBill ? 'Update Bill' : 'Submit Bill'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3>Filters</h3>
          {(filterVendor || filterStatus || filterMonth) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setFilterVendor('');
                setFilterStatus('');
                setFilterMonth('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="filter-section">
          <div className="form-group">
            <label>Search Vendor</label>
            <input
              type="text"
              placeholder="Type vendor name..."
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group">
            <label>Payment Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '5px' }}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Month</label>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '5px' }}
            >
              <option value="">All Months</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        {filteredBills.length !== bills.length && (
          <div className="filter-summary">
            Showing {filteredBills.length} of {bills.length} bills
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{stats.totalBills}</div>
            <div className="stat-label">Total Bills</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.paidBills}</div>
            <div className="stat-label">Paid Bills</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pendingBills}</div>
            <div className="stat-label">Pending Bills</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.uniqueVendorsCount}</div>
            <div className="stat-label">Unique Vendors</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>General Bills</h2>
        </div>

        {filteredBills.length === 0 ? (
          <div className="empty-state">
            <h3>{bills.length === 0 ? 'No general bills submitted yet' : 'No bills match your filters'}</h3>
            <p>{bills.length === 0 ? 'Click "New General Bill" to submit your first bill.' : 'Try adjusting your filter criteria.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Vendor Name</th>
                  <th>Invoice No</th>
                  <th>Invoice Date</th>
                  <th>Month</th>
                  <th>Payable Amount</th>
                  <th>Payment Status</th>
                  <th>Uploaded Date</th>
                  <th>Approved By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => (
                  <tr key={bill.id}>
                    <td>{index + 1}</td>
                    <td>{bill.vendorName}</td>
                    <td><strong>{bill.invoiceNo}</strong></td>
                    <td>{bill.invoiceDate || '-'}</td>
                    <td>{bill.month || '-'}</td>
                    <td>₹{bill.payableAmount?.toLocaleString('en-IN') || '0'}</td>
                    <td>
                      <span className={`badge ${bill.paymentStatus === 'Payment done' ? 'badge-approved' : bill.paymentStatus === 'Hold' ? 'badge-declined' : 'badge-pending'}`}>
                        {bill.paymentStatus}
                      </span>
                    </td>
                    <td>{bill.uploadedDate || '-'}</td>
                    <td>{bill.approvedBy || '-'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(bill)}
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

      {/* Vendor Summary */}
      {vendorSummary.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Vendor Summary</h2>
          </div>
          <div className="vendor-analytics">
            {vendorSummary.slice(0, 10).map((vendor, index) => (
              <div key={vendor.vendor} className="vendor-card">
                <div className="vendor-card-header">
                  <div className="vendor-info">
                    <span className="vendor-name">{vendor.vendor}</span>
                    <span className="vendor-count">{vendor.billCount} bills</span>
                  </div>
                  <div className="vendor-amount-badge">
                    <span className="vendor-pl-amount">₹{vendor.totalAmount.toLocaleString('en-IN')}</span>
                    <span className="vendor-pl-label">Total Amount</span>
                  </div>
                </div>
                <div className="vendor-details">
                  <div className="vendor-detail-item">
                    <div className="vendor-detail-value">₹{vendor.paidAmount.toLocaleString('en-IN')}</div>
                    <div className="vendor-detail-label">Paid</div>
                  </div>
                  <div className="vendor-detail-item">
                    <div className="vendor-detail-value">₹{vendor.pendingAmount.toLocaleString('en-IN')}</div>
                    <div className="vendor-detail-label">Pending</div>
                  </div>
                  <div className="vendor-detail-item">
                    <div className="vendor-detail-value">{((vendor.paidAmount / vendor.totalAmount) * 100 || 0).toFixed(1)}%</div>
                    <div className="vendor-detail-label">Paid %</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {vendorSummary.length > 10 && (
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
              Showing top 10 vendors. Total: {vendorSummary.length} vendors.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default GeneralBills;