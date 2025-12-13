import React, { useState, useMemo } from 'react';

function TeamPortal({ invoices, addInvoice, updateInvoice }) {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    vendorName: '',
    city: '',
    invoiceDate: '',
    packingMaterial: '',
    receivedAmount: '',
    remarks: '',
    invoiceAmount: '',
    profitLoss: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    // Auto-calculate P/L when packing, received, or invoice amount changes
    if (name === 'packingMaterial' || name === 'receivedAmount' || name === 'invoiceAmount') {
      const packing = parseFloat(updatedFormData.packingMaterial) || 0;
      const received = parseFloat(updatedFormData.receivedAmount) || 0;
      const invoice = parseFloat(updatedFormData.invoiceAmount) || 0;

      // P/L = Received - Packing Material - Invoice Amount
      const calculatedPL = received - packing - invoice;
      updatedFormData.profitLoss = calculatedPL.toFixed(2);
    }

    setFormData(updatedFormData);
  };

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

  // Filter invoices based on month, city, and vendor
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
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

      return monthMatch && cityMatch && vendorMatch;
    });
  }, [invoices, filterMonth, filterCity, filterVendor]);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0),
    totalPL: filteredInvoices.reduce((sum, inv) => sum + (inv.profitLoss || 0), 0)
  }), [filteredInvoices]);

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

  const formatMonthLabel = (monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const invoiceData = {
      ...formData,
      packingMaterial: parseFloat(formData.packingMaterial) || 0,
      receivedAmount: parseFloat(formData.receivedAmount) || 0,
      invoiceAmount: parseFloat(formData.invoiceAmount),
      profitLoss: parseFloat(formData.profitLoss)
    };

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData);
      setSuccessMessage('Invoice updated successfully!');
    } else {
      addInvoice(invoiceData);
      setSuccessMessage('Invoice submitted successfully! Waiting for admin approval.');
    }

    // Reset form
    setFormData({
      invoiceNumber: '',
      vendorName: '',
      city: '',
      invoiceDate: '',
      packingMaterial: '',
      receivedAmount: '',
      remarks: '',
      invoiceAmount: '',
      profitLoss: ''
    });

    setShowForm(false);
    setEditingInvoice(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (invoice) => {
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      vendorName: invoice.vendorName || '',
      city: invoice.city || '',
      invoiceDate: invoice.invoiceDate || '',
      packingMaterial: invoice.packingMaterial?.toString() || '',
      receivedAmount: invoice.receivedAmount?.toString() || '',
      remarks: invoice.remarks || '',
      invoiceAmount: invoice.invoiceAmount?.toString() || '',
      profitLoss: invoice.profitLoss?.toString() || ''
    });
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      vendorName: '',
      city: '',
      invoiceDate: '',
      packingMaterial: '',
      receivedAmount: '',
      remarks: '',
      invoiceAmount: '',
      profitLoss: ''
    });
  };

  return (
    <div className="team-portal">
      <div className="card">
        <div className="card-header">
          <h2>{editingInvoice ? 'Edit Invoice' : 'Submit New Invoice'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Invoice
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
                <label>Invoice Number *</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  placeholder="Enter invoice number"
                  required
                />
              </div>
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
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Packing Material ($)</label>
                <input
                  type="number"
                  name="packingMaterial"
                  value={formData.packingMaterial}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Received from Customer ($)</label>
                <input
                  type="number"
                  name="receivedAmount"
                  value={formData.receivedAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Invoice Amount ($) *</label>
                <input
                  type="number"
                  name="invoiceAmount"
                  value={formData.invoiceAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>P/L ($) <span style={{ fontSize: '0.8rem', color: '#888' }}>(Auto-calculated)</span></label>
                <input
                  type="number"
                  name="profitLoss"
                  value={formData.profitLoss}
                  readOnly
                  placeholder="Auto-calculated"
                  step="0.01"
                  className={parseFloat(formData.profitLoss) >= 0 ? 'input-profit' : 'input-loss'}
                  style={{
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                    color: parseFloat(formData.profitLoss) >= 0 ? '#28a745' : '#dc3545'
                  }}
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
                {editingInvoice ? 'Update Invoice' : 'Submit Invoice'}
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
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <h3 style={{ color: '#1e3c72', marginBottom: '5px' }}>
              ${stats.totalAmount.toFixed(2)}
            </h3>
            <span style={{ color: '#666' }}>Total Invoice Amount</span>
          </div>
          <div>
            <h3 style={{ color: stats.totalPL >= 0 ? '#28a745' : '#dc3545', marginBottom: '5px' }}>
              {stats.totalPL >= 0 ? '+' : ''}{stats.totalPL.toFixed(2)}
            </h3>
            <span style={{ color: '#666' }}>Total P/L</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>My Submitted Invoices</h2>
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
          {(filterMonth !== 'all' || filterCity !== 'all' || filterVendor !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilterMonth('all');
                setFilterCity('all');
                setFilterVendor('all');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <h3>No invoices submitted yet</h3>
            <p>Click "New Invoice" to submit your first invoice.</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoiceNumber}</strong></td>
                    <td>{invoice.invoiceDate || '-'}</td>
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
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(invoice)}
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
    </div>
  );
}

export default TeamPortal;
