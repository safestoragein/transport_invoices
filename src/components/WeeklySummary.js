import React, { useMemo, useState } from 'react';

function WeeklySummary({ 
  invoices, 
  generalBills, 
  packingMaterials, 
  pettyCash, 
  happyCard, 
  refunds, 
  driveTrackPorter, 
  reviews 
}) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [showMonthlyView, setShowMonthlyView] = useState(false);

  // Group data by month
  const monthlyGroupedData = useMemo(() => {
    const allData = [
      ...invoices.map(item => ({ 
        ...item, 
        type: 'Transport Bill', 
        date: item.invoiceDate || item.submittedAt,
        amount: item.invoiceAmount || 0
      })),
      ...generalBills.map(item => ({ 
        ...item, 
        type: 'General Bill', 
        date: item.invoiceDate || item.submittedAt,
        amount: item.payableAmount || 0
      })),
      ...packingMaterials.map(item => ({ 
        ...item, 
        type: 'Packing Material', 
        date: item.invoiceDate || item.submittedAt,
        amount: item.payableAmount || 0
      })),
      ...pettyCash.map(item => ({ 
        ...item, 
        type: 'Petty Cash', 
        date: item.submittedAt,
        amount: item.payableAmount || 0
      })),
      ...happyCard.map(item => ({ 
        ...item, 
        type: 'Happy Card', 
        date: item.submittedAt,
        amount: item.payableAmount || 0
      })),
      ...refunds.map(item => ({ 
        ...item, 
        type: 'Refund', 
        date: item.date || item.submittedAt,
        amount: -(item.refundAmount || 0) // Negative for refunds
      })),
      ...driveTrackPorter.map(item => ({ 
        ...item, 
        type: 'Drive Track/Porter', 
        date: item.uploaded || item.submittedAt,
        amount: item.amount || 0
      })),
      ...reviews.map(item => ({ 
        ...item, 
        type: 'Review', 
        date: item.date || item.submittedAt,
        amount: item.amount || 0
      }))
    ];

    const grouped = {};
    allData.forEach(item => {
      if (item.date) {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            totalAmount: 0,
            totalTransactions: 0,
            items: [],
            types: {}
          };
        }
        
        grouped[monthKey].totalAmount += item.amount;
        grouped[monthKey].totalTransactions += 1;
        grouped[monthKey].items.push(item);
        
        if (!grouped[monthKey].types[item.type]) {
          grouped[monthKey].types[item.type] = { count: 0, amount: 0 };
        }
        grouped[monthKey].types[item.type].count += 1;
        grouped[monthKey].types[item.type].amount += item.amount;
      }
    });

    return grouped;
  }, [invoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  // Get current month data
  const currentMonthData = monthlyGroupedData[selectedMonth] || { totalAmount: 0, totalTransactions: 0, items: [], types: {} };

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const transportTotal = invoices.reduce((sum, inv) => sum + (inv.invoiceAmount || 0), 0);
    const generalTotal = generalBills.reduce((sum, bill) => sum + (bill.payableAmount || 0), 0);
    const packingTotal = packingMaterials.reduce((sum, material) => sum + (material.payableAmount || 0), 0);
    const pettyCashTotal = pettyCash.reduce((sum, cash) => sum + (cash.payableAmount || 0), 0);
    const happyCardTotal = happyCard.reduce((sum, card) => sum + (card.payableAmount || 0), 0);
    const refundsTotal = refunds.reduce((sum, refund) => sum + (refund.refundAmount || 0), 0);
    const driveTrackTotal = driveTrackPorter.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const reviewsTotal = reviews.reduce((sum, review) => sum + (review.amount || 0), 0);

    const grandTotal = transportTotal + generalTotal + packingTotal + pettyCashTotal + 
                      happyCardTotal + driveTrackTotal + reviewsTotal;
    
    // Net amount (income - refunds)
    const netTotal = grandTotal - refundsTotal;

    return {
      transportTotal,
      generalTotal,
      packingTotal,
      pettyCashTotal,
      happyCardTotal,
      refundsTotal,
      driveTrackTotal,
      reviewsTotal,
      grandTotal,
      netTotal,
      totalTransactions: invoices.length + generalBills.length + packingMaterials.length + 
                        pettyCash.length + happyCard.length + refunds.length + 
                        driveTrackPorter.length + reviews.length
    };
  }, [invoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  // Module data for the grid
  const moduleData = [
    {
      title: 'Transport Bills',
      amount: stats.transportTotal,
      count: invoices.length,
      icon: '🚚',
      color: '#1e3c72',
      bgColor: '#e8f1ff'
    },
    {
      title: 'General Bills',
      amount: stats.generalTotal,
      count: generalBills.length,
      icon: '📄',
      color: '#28a745',
      bgColor: '#e8f5e8'
    },
    {
      title: 'Packing Materials',
      amount: stats.packingTotal,
      count: packingMaterials.length,
      icon: '📦',
      color: '#17a2b8',
      bgColor: '#e8f8ff'
    },
    {
      title: 'Petty Cash',
      amount: stats.pettyCashTotal,
      count: pettyCash.length,
      icon: '💰',
      color: '#ffc107',
      bgColor: '#fff8e1'
    },
    {
      title: 'Happy Card',
      amount: stats.happyCardTotal,
      count: happyCard.length,
      icon: '💳',
      color: '#6f42c1',
      bgColor: '#f3e8ff'
    },
    {
      title: 'Drive Track & Porter',
      amount: stats.driveTrackTotal,
      count: driveTrackPorter.length,
      icon: '🚗',
      color: '#fd7e14',
      bgColor: '#fff2e8'
    },
    {
      title: 'Reviews',
      amount: stats.reviewsTotal,
      count: reviews.length,
      icon: '⭐',
      color: '#20c997',
      bgColor: '#e8fff8'
    },
    {
      title: 'Refunds',
      amount: stats.refundsTotal,
      count: refunds.length,
      icon: '↩️',
      color: '#dc3545',
      bgColor: '#ffe8e8'
    }
  ];

  // Recent activity from all modules
  const recentActivity = useMemo(() => {
    const allActivities = [
      ...invoices.map(inv => ({ ...inv, type: 'Transport', date: inv.submittedAt || inv.invoiceDate, amount: inv.invoiceAmount })),
      ...generalBills.map(bill => ({ ...bill, type: 'General Bill', date: bill.submittedAt || bill.invoiceDate, amount: bill.payableAmount })),
      ...packingMaterials.map(material => ({ ...material, type: 'Packing Material', date: material.submittedAt || material.invoiceDate, amount: material.payableAmount })),
      ...pettyCash.map(cash => ({ ...cash, type: 'Petty Cash', date: cash.submittedAt, amount: cash.payableAmount })),
      ...happyCard.map(card => ({ ...card, type: 'Happy Card', date: card.submittedAt, amount: card.payableAmount })),
      ...refunds.map(refund => ({ ...refund, type: 'Refund', date: refund.submittedAt || refund.date, amount: refund.refundAmount })),
      ...driveTrackPorter.map(entry => ({ ...entry, type: 'Drive Track/Porter', date: entry.submittedAt || entry.uploaded, amount: entry.amount })),
      ...reviews.map(review => ({ ...review, type: 'Review', date: review.submittedAt || review.date, amount: review.amount }))
    ];

    return allActivities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10); // Last 10 activities
  }, [invoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  const formatMonthName = (monthKey) => {
    if (!monthKey) return '';
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getAvailableMonths = () => {
    return Object.keys(monthlyGroupedData).sort().reverse();
  };

  return (
    <div className="weekly-summary">
      {/* View Toggle */}
      <div className="card">
        <div className="card-header">
          <h2>Dashboard View</h2>
          <div className="view-controls">
            <button 
              className={`btn ${!showMonthlyView ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowMonthlyView(false)}
            >
              Overall View
            </button>
            <button 
              className={`btn ${showMonthlyView ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowMonthlyView(true)}
            >
              Monthly View
            </button>
            {showMonthlyView && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-group"
                style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '5px' }}
              >
                {getAvailableMonths().map(month => (
                  <option key={month} value={month}>
                    {formatMonthName(month)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Header Summary Cards */}
      <div className="summary-header">
        <div className="summary-main-card">
          <div className="summary-main-content">
            <h1>{showMonthlyView ? `${formatMonthName(selectedMonth)} Dashboard` : 'Accounts Dashboard'}</h1>
            <div className="main-stats">
              <div className="main-stat">
                <span className="main-stat-label">Total Revenue</span>
                <span className="main-stat-value" style={{ color: '#28a745' }}>
                  ₹{showMonthlyView ? Math.max(0, currentMonthData.totalAmount).toLocaleString('en-IN') : stats.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="main-stat">
                <span className="main-stat-label">Net Amount</span>
                <span className="main-stat-value" style={{ color: (showMonthlyView ? currentMonthData.totalAmount : stats.netTotal) >= 0 ? '#28a745' : '#dc3545' }}>
                  ₹{showMonthlyView ? currentMonthData.totalAmount.toLocaleString('en-IN') : stats.netTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="main-stat">
                <span className="main-stat-label">Total Transactions</span>
                <span className="main-stat-value" style={{ color: '#1e3c72' }}>
                  {showMonthlyView ? currentMonthData.totalTransactions : stats.totalTransactions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown - Only shown in monthly view */}
      {showMonthlyView && Object.keys(currentMonthData.types).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Monthly Breakdown - {formatMonthName(selectedMonth)}</h2>
          </div>
          <div className="type-breakdown">
            {Object.entries(currentMonthData.types).map(([type, data]) => (
              <div key={type} className="type-item">
                <div className="type-name">{type}</div>
                <div className="type-stats">
                  {data.count} items • ₹{data.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Overview Grid */}
      <div className="card">
        <div className="card-header">
          <h2>Module Overview</h2>
        </div>
        <div className="modules-grid">
          {moduleData.map((module, index) => (
            <div key={index} className="module-card" style={{ backgroundColor: module.bgColor }}>
              <div className="module-header">
                <span className="module-icon">{module.icon}</span>
                <span className="module-title">{module.title}</span>
              </div>
              <div className="module-stats">
                <div className="module-amount" style={{ color: module.color }}>
                  ₹{module.amount.toLocaleString('en-IN')}
                </div>
                <div className="module-count">
                  {module.count} entries
                </div>
              </div>
              {module.title === 'Refunds' && (
                <div className="module-note" style={{ color: '#dc3545', fontSize: '0.8rem' }}>
                  (Deducted from total)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card">
        <div className="card-header">
          <h2>Financial Summary</h2>
        </div>
        <div className="financial-breakdown">
          <div className="breakdown-section">
            <h3>Income Sources</h3>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span className="breakdown-label">Transport Bills</span>
                <span className="breakdown-value">₹{stats.transportTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">General Bills</span>
                <span className="breakdown-value">₹{stats.generalTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Packing Materials</span>
                <span className="breakdown-value">₹{stats.packingTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Other Sources</span>
                <span className="breakdown-value">
                  ₹{(stats.pettyCashTotal + stats.happyCardTotal + stats.driveTrackTotal + stats.reviewsTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="breakdown-section">
            <h3>Deductions</h3>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span className="breakdown-label">Refunds</span>
                <span className="breakdown-value" style={{ color: '#dc3545' }}>
                  -₹{stats.refundsTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="breakdown-total">
            <div className="breakdown-item total">
              <span className="breakdown-label">Net Total</span>
              <span className="breakdown-value" style={{ 
                color: stats.netTotal >= 0 ? '#28a745' : '#dc3545',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}>
                ₹{stats.netTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2>{showMonthlyView ? `${formatMonthName(selectedMonth)} Activity` : 'Recent Activity'}</h2>
        </div>
        
        {(showMonthlyView ? currentMonthData.items.length === 0 : recentActivity.length === 0) ? (
          <div className="empty-state">
            <h3>{showMonthlyView ? 'No activity for this month' : 'No recent activity'}</h3>
            <p>{showMonthlyView ? 'No entries found for the selected month.' : 'Start adding entries to see recent activity here.'}</p>
          </div>
        ) : (
          <div className="recent-activity">
            {(showMonthlyView ? currentMonthData.items.slice(0, 10) : recentActivity).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-type">
                  <span className={`badge ${
                    activity.type === 'Transport' ? 'badge-approved' :
                    activity.type === 'General Bill' ? 'badge-pending' :
                    activity.type === 'Refund' ? 'badge-declined' :
                    'badge-approved'
                  }`}>
                    {activity.type}
                  </span>
                </div>
                <div className="activity-details">
                  <div className="activity-title">
                    {activity.vendorName || activity.customerId || activity.name || `${activity.type} Entry`}
                  </div>
                  <div className="activity-date">
                    {activity.date ? new Date(activity.date).toLocaleDateString() : 'No date'}
                  </div>
                </div>
                <div className="activity-amount" style={{
                  color: activity.type === 'Refund' ? '#dc3545' : '#28a745'
                }}>
                  {activity.type === 'Refund' ? '-' : '+'}₹{activity.amount?.toLocaleString('en-IN') || '0'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <a href="#transport-bills" className="action-btn transport">
            <span className="action-icon">🚚</span>
            <span>Add Transport Bill</span>
          </a>
          <a href="#general-bills" className="action-btn general">
            <span className="action-icon">📄</span>
            <span>Add General Bill</span>
          </a>
          <a href="#packing-materials" className="action-btn packing">
            <span className="action-icon">📦</span>
            <span>Add Packing Material</span>
          </a>
          <a href="#petty-cash" className="action-btn petty">
            <span className="action-icon">💰</span>
            <span>Add Petty Cash</span>
          </a>
          <a href="#refunds" className="action-btn refunds">
            <span className="action-icon">↩️</span>
            <span>Process Refund</span>
          </a>
          <a href="#reviews" className="action-btn reviews">
            <span className="action-icon">⭐</span>
            <span>Add Review</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default WeeklySummary;