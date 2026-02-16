import React, { useState, useMemo } from 'react';

function HappyCard({ cards, addCard }) {
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    vendorName: 'Happay card',
    month: '',
    payableAmount: '',
    remarks: '',
    paymentStatus: 'Payment done',
    uploadedDate: '',
    approvedBy: '',
    approvedDate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cardData = {
      ...formData,
      payableAmount: parseFloat(formData.payableAmount) || 0
    };

    if (editingCard) {
      setSuccessMessage('Happy card updated successfully!');
    } else {
      addCard(cardData);
      setSuccessMessage('Happy card submitted successfully!');
    }

    // Reset form
    setFormData({
      vendorName: 'Happay card',
      month: '',
      payableAmount: '',
      remarks: '',
      paymentStatus: 'Payment done',
      uploadedDate: '',
      approvedBy: '',
      approvedDate: ''
    });

    setShowForm(false);
    setEditingCard(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (card) => {
    setFormData({
      vendorName: card.vendorName || 'Happay card',
      month: card.month || '',
      payableAmount: card.payableAmount?.toString() || '',
      remarks: card.remarks || '',
      paymentStatus: card.paymentStatus || 'Payment done',
      uploadedDate: card.uploadedDate || '',
      approvedBy: card.approvedBy || '',
      approvedDate: card.approvedDate || ''
    });
    setEditingCard(card);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCard(null);
    setFormData({
      vendorName: 'Happay card',
      month: '',
      payableAmount: '',
      remarks: '',
      paymentStatus: 'Payment done',
      uploadedDate: '',
      approvedBy: '',
      approvedDate: ''
    });
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: cards.reduce((sum, card) => sum + (card.payableAmount || 0), 0),
    totalCards: cards.length,
    paidCards: cards.filter(card => card.paymentStatus === 'Payment done').length,
    advancePayments: cards.filter(card => card.remarks && card.remarks.includes('advance')).length
  }), [cards]);

  // Get unique months for filtering
  const availableMonths = useMemo(() => {
    const months = new Set();
    cards.forEach(card => {
      if (card.month) months.add(card.month);
    });
    return Array.from(months).sort();
  }, [cards]);

  return (
    <div className="happy-card">
      <div className="card">
        <div className="card-header">
          <h2>{editingCard ? 'Edit Happy Card' : 'Submit New Happy Card'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Happy Card
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
                <label>Vendor Name</label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleInputChange}
                  placeholder="Happay card"
                  readOnly
                  style={{
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed'
                  }}
                />
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
                  <option value="Jan">January</option>
                  <option value="Feb">February</option>
                  <option value="Mar">March</option>
                  <option value="Apr">April</option>
                  <option value="May">May</option>
                  <option value="Jun">June</option>
                  <option value="Jul">July</option>
                  <option value="Aug">August</option>
                  <option value="Sep">September</option>
                  <option value="Oct">October</option>
                  <option value="Nov">November</option>
                  <option value="Dec">December</option>
                </select>
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
                  placeholder="20000"
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
                <label>Approved Date</label>
                <input
                  type="date"
                  name="approvedDate"
                  value={formData.approvedDate}
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
                placeholder="Ramesh sir"
              />
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="advance, reimbursement, etc."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingCard ? 'Update Card' : 'Submit Card'}
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
            <div className="stat-number">{stats.totalCards}</div>
            <div className="stat-label">Total Cards</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.paidCards}</div>
            <div className="stat-label">Paid Cards</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.advancePayments}</div>
            <div className="stat-label">Advance Payments</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">₹{stats.totalAmount.toLocaleString('en-IN')}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Happy Card Payments</h2>
        </div>

        {cards.length === 0 ? (
          <div className="empty-state">
            <h3>No Happy card entries submitted yet</h3>
            <p>Click "New Happy Card" to submit your first entry.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Month</th>
                  <th>Payable Amount</th>
                  <th>Remarks</th>
                  <th>Payment Status</th>
                  <th>Uploaded Date</th>
                  <th>Approved By</th>
                  <th>Approved Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <span className="badge badge-approved">
                        {card.vendorName}
                      </span>
                    </td>
                    <td><strong>{card.month}</strong></td>
                    <td style={{ 
                      color: card.payableAmount >= 20000 ? '#28a745' : '#6c757d',
                      fontWeight: 'bold'
                    }}>
                      ₹{card.payableAmount?.toLocaleString('en-IN') || '0'}
                    </td>
                    <td>{card.remarks || '-'}</td>
                    <td>
                      <span className={`badge ${card.paymentStatus === 'Payment done' ? 'badge-approved' : 'badge-pending'}`}>
                        {card.paymentStatus}
                      </span>
                    </td>
                    <td>{card.uploadedDate || '-'}</td>
                    <td>{card.approvedBy || '-'}</td>
                    <td>{card.approvedDate || '-'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(card)}
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

export default HappyCard;