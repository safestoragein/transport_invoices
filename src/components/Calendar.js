import React, { useState, useMemo } from 'react';

function Calendar({ 
  invoices, 
  generalBills, 
  packingMaterials, 
  pettyCash, 
  happyCard, 
  refunds, 
  driveTrackPorter, 
  reviews 
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'year'

  // Group all data by month and year
  const groupedData = useMemo(() => {
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

    // Group by month-year
    const grouped = {};
    allData.forEach(item => {
      if (item.date) {
        const date = new Date(item.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = `${monthYear}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (!grouped[monthYear]) {
          grouped[monthYear] = {
            totalAmount: 0,
            totalTransactions: 0,
            days: {},
            types: {}
          };
        }
        
        if (!grouped[monthYear].days[dayKey]) {
          grouped[monthYear].days[dayKey] = {
            date: date,
            amount: 0,
            transactions: []
          };
        }
        
        grouped[monthYear].totalAmount += item.amount;
        grouped[monthYear].totalTransactions += 1;
        grouped[monthYear].days[dayKey].amount += item.amount;
        grouped[monthYear].days[dayKey].transactions.push(item);
        
        if (!grouped[monthYear].types[item.type]) {
          grouped[monthYear].types[item.type] = { count: 0, amount: 0 };
        }
        grouped[monthYear].types[item.type].count += 1;
        grouped[monthYear].types[item.type].amount += item.amount;
      }
    });

    return grouped;
  }, [invoices, generalBills, packingMaterials, pettyCash, happyCard, refunds, driveTrackPorter, reviews]);

  // Get current month data
  const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = useMemo(() => 
    groupedData[currentMonthKey] || { totalAmount: 0, totalTransactions: 0, days: {}, types: {} },
    [groupedData, currentMonthKey]
  );

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks
      const dayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const dayData = currentMonthData.days[dayKey] || { amount: 0, transactions: [] };
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        dayData: dayData,
        key: dayKey
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [selectedDate, currentMonthData]);

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const navigateYear = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + direction);
    setSelectedDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const yearlyData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const yearData = {};
    
    Object.keys(groupedData).forEach(monthKey => {
      const [monthYear] = monthKey.split('-');
      if (parseInt(monthYear) === year) {
        const monthIndex = parseInt(monthKey.split('-')[1]) - 1;
        yearData[monthIndex] = groupedData[monthKey];
      }
    });
    
    return yearData;
  }, [groupedData, selectedDate]);

  const getAmountColor = (amount) => {
    if (amount > 0) return '#28a745';
    if (amount < 0) return '#dc3545';
    return '#6c757d';
  };

  const formatAmount = (amount) => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (absAmount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  };

  if (view === 'year') {
    return (
      <div className="calendar-view">
        <div className="card">
          <div className="card-header">
            <div className="calendar-header">
              <button className="btn btn-secondary" onClick={() => navigateYear(-1)}>‹‹</button>
              <h2>{selectedDate.getFullYear()}</h2>
              <button className="btn btn-secondary" onClick={() => navigateYear(1)}>››</button>
            </div>
            <div className="view-controls">
              <button 
                className={`btn ${view === 'year' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setView('year')}
              >
                Year View
              </button>
              <button 
                className={`btn ${view === 'month' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setView('month')}
              >
                Month View
              </button>
            </div>
          </div>

          <div className="year-view">
            <div className="months-grid">
              {monthNames.map((monthName, index) => {
                const monthData = yearlyData[index] || { totalAmount: 0, totalTransactions: 0 };
                return (
                  <div 
                    key={index} 
                    className={`month-card ${monthData.totalTransactions > 0 ? 'has-data' : ''}`}
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(index);
                      setSelectedDate(newDate);
                      setView('month');
                    }}
                  >
                    <div className="month-name">{monthName}</div>
                    <div className="month-stats">
                      <div className="month-amount" style={{ color: getAmountColor(monthData.totalAmount) }}>
                        ₹{formatAmount(monthData.totalAmount)}
                      </div>
                      <div className="month-transactions">
                        {monthData.totalTransactions} transactions
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      {/* Month Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h2>Monthly Summary - {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
        </div>
        <div className="monthly-summary">
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-value" style={{ color: getAmountColor(currentMonthData.totalAmount) }}>
                ₹{currentMonthData.totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="stat-label">Total Amount</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{currentMonthData.totalTransactions}</span>
              <span className="stat-label">Transactions</span>
            </div>
          </div>
          
          {Object.keys(currentMonthData.types).length > 0 && (
            <div className="type-breakdown">
              {Object.entries(currentMonthData.types).map(([type, data]) => (
                <div key={type} className="type-item">
                  <span className="type-name">{type}</span>
                  <span className="type-stats">
                    {data.count} items • ₹{data.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="card-header">
          <div className="calendar-header">
            <button className="btn btn-secondary" onClick={() => navigateMonth(-1)}>‹</button>
            <h2>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
            <button className="btn btn-secondary" onClick={() => navigateMonth(1)}>›</button>
          </div>
          <div className="view-controls">
            <button 
              className={`btn ${view === 'year' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView('year')}
            >
              Year View
            </button>
            <button 
              className={`btn ${view === 'month' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView('month')}
            >
              Month View
            </button>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {calendarDays.map((day, index) => (
              <div 
                key={index}
                className={`calendar-day ${day.isCurrentMonth ? '' : 'other-month'} ${day.isToday ? 'today' : ''} ${day.dayData.transactions.length > 0 ? 'has-transactions' : ''}`}
              >
                <div className="day-number">{day.date.getDate()}</div>
                {day.dayData.transactions.length > 0 && (
                  <div className="day-data">
                    <div className="day-amount" style={{ color: getAmountColor(day.dayData.amount) }}>
                      ₹{formatAmount(day.dayData.amount)}
                    </div>
                    <div className="day-count">{day.dayData.transactions.length}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;