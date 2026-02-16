import React, { useState, useMemo } from 'react';

function Reviews({ reviews, addReview }) {
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    remarksReviews: '',
    city: '',
    amount: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const reviewData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      remarksReviews: parseInt(formData.remarksReviews) || 0
    };

    if (editingReview) {
      setSuccessMessage('Review updated successfully!');
    } else {
      addReview(reviewData);
      setSuccessMessage('Review submitted successfully!');
    }

    // Reset form
    setFormData({
      date: '',
      name: '',
      remarksReviews: '',
      city: '',
      amount: ''
    });

    setShowForm(false);
    setEditingReview(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleEdit = (review) => {
    setFormData({
      date: review.date || '',
      name: review.name || '',
      remarksReviews: review.remarksReviews?.toString() || '',
      city: review.city || '',
      amount: review.amount?.toString() || ''
    });
    setEditingReview(review);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReview(null);
    setFormData({
      date: '',
      name: '',
      remarksReviews: '',
      city: '',
      amount: ''
    });
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    totalAmount: reviews.reduce((sum, review) => sum + (review.amount || 0), 0),
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? 
      (reviews.reduce((sum, review) => sum + (review.remarksReviews || 0), 0) / reviews.length).toFixed(1) : '0',
    highRatings: reviews.filter(review => (review.remarksReviews || 0) >= 4).length,
    lowRatings: reviews.filter(review => (review.remarksReviews || 0) <= 2).length
  }), [reviews]);

  // Get unique cities for filtering
  const availableCities = useMemo(() => {
    const cities = new Set();
    reviews.forEach(review => {
      if (review.city) cities.add(review.city);
    });
    return Array.from(cities).sort();
  }, [reviews]);

  // City options from screenshot
  const cityOptions = [
    'Bangalore',
    'Delhi', 
    'Chennai',
    'Hyderabad',
    'Mumbai',
    'Pune'
  ];

  // Get star rating display
  const getStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('⭐');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  return (
    <div className="reviews">
      <div className="card">
        <div className="card-header">
          <h2>{editingReview ? 'Edit Review' : 'Submit New Review'}</h2>
          {!showForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + New Review
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
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rating (1-5) *</label>
                <select
                  name="remarksReviews"
                  value={formData.remarksReviews}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select rating</option>
                  <option value="1">⭐ (1 star)</option>
                  <option value="2">⭐⭐ (2 stars)</option>
                  <option value="3">⭐⭐⭐ (3 stars)</option>
                  <option value="4">⭐⭐⭐⭐ (4 stars)</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                  <option value="6">⭐⭐⭐⭐⭐⭐ (6 stars)</option>
                  <option value="11">Special (11 rating)</option>
                </select>
              </div>
              <div className="form-group">
                <label>City *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select city</option>
                  {cityOptions.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Amount ($) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="200"
                step="0.01"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingReview ? 'Update Review' : 'Submit Review'}
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
            <div className="stat-number">{stats.totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.averageRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.highRatings}</div>
            <div className="stat-label">High Ratings (4+)</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">${stats.totalAmount.toFixed(2)}</div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Customer Reviews</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews submitted yet</h3>
            <p>Click "New Review" to submit your first review.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Rating</th>
                  <th>City</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td>{review.date}</td>
                    <td><strong>{review.name}</strong></td>
                    <td style={{ fontSize: '1.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{getStarRating(review.remarksReviews || 0)}</span>
                        <span style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: 'bold',
                          color: (review.remarksReviews || 0) >= 4 ? '#28a745' : 
                                (review.remarksReviews || 0) >= 3 ? '#ffc107' : '#dc3545'
                        }}>
                          ({review.remarksReviews || 0})
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        review.city === 'Bangalore' ? 'badge-approved' :
                        review.city === 'Delhi' ? 'badge-pending' :
                        'badge-declined'
                      }`}>
                        {review.city}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: 'bold',
                      color: review.amount >= 1000 ? '#28a745' : 
                             review.amount >= 500 ? '#ffc107' : '#6c757d'
                    }}>
                      ${review.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEdit(review)}
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

      {/* Reviews Analytics */}
      {reviews.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Reviews Analytics</h2>
          </div>

          <div className="analytics-summary">
            <div className="summary-card profit-summary">
              <div className="summary-icon">⭐</div>
              <span className="summary-value">{stats.highRatings}</span>
              <span className="summary-label">High Ratings</span>
            </div>
            <div className="summary-card total">
              <div className="summary-icon">📊</div>
              <span className="summary-value">{stats.averageRating}</span>
              <span className="summary-label">Average Rating</span>
            </div>
            <div className="summary-card loss-summary">
              <div className="summary-icon">📉</div>
              <span className="summary-value">{stats.lowRatings}</span>
              <span className="summary-label">Low Ratings</span>
            </div>
          </div>

          {/* City-wise Reviews */}
          <div className="vendor-analytics">
            {availableCities.map(city => {
              const cityReviews = reviews.filter(r => r.city === city);
              const cityAverage = cityReviews.length > 0 ? 
                (cityReviews.reduce((sum, r) => sum + (r.remarksReviews || 0), 0) / cityReviews.length).toFixed(1) : 0;
              
              return (
                <div key={city} className={`vendor-card ${cityAverage >= 4 ? 'profit-card' : 'loss-card'}`}>
                  <div className="vendor-card-header">
                    <div className="vendor-info">
                      <span className="vendor-name">{city}</span>
                      <span className="vendor-count">{cityReviews.length} review(s)</span>
                    </div>
                    <div className="vendor-amount-badge">
                      <span className={`vendor-pl-amount ${cityAverage >= 4 ? 'profit' : 'loss'}`}>
                        {cityAverage} ⭐
                      </span>
                      <span className="vendor-pl-label">Average Rating</span>
                    </div>
                  </div>
                  <div className="vendor-details">
                    <div className="vendor-detail-item">
                      <span className="vendor-detail-value">${cityReviews.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}</span>
                      <span className="vendor-detail-label">Total Amount</span>
                    </div>
                    <div className="vendor-detail-item">
                      <span className="vendor-detail-value">{cityReviews.filter(r => (r.remarksReviews || 0) >= 4).length}</span>
                      <span className="vendor-detail-label">High Ratings</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;