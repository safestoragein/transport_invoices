import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Card, CardHeader, Badge } from '../common';
import { formatCurrency, formatDate, parseDate } from '../../utils/formatters';
import { MODULE_CONFIG } from '../../utils/constants';

/**
 * CalendarView - Daily entries visualization
 */
const CalendarView = () => {
  const { getAllEntries } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const allEntries = getAllEntries();

  // Get entries by date
  const entriesByDate = useMemo(() => {
    const byDate = {};

    allEntries.forEach(entry => {
      const dateStr = entry.invoiceDate || entry.date || entry.submittedAt;
      const date = parseDate(dateStr);
      if (!date) return;

      const key = date.toISOString().split('T')[0];
      if (!byDate[key]) {
        byDate[key] = [];
      }
      byDate[key].push(entry);
    });

    return byDate;
  }, [allEntries]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Padding for previous month
    for (let i = 0; i < startPadding; i++) {
      const prevDate = new Date(year, month, -startPadding + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Padding for next month
    const endPadding = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const navigateMonth = (delta) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const getDayEntries = (date) => {
    const key = date.toISOString().split('T')[0];
    return entriesByDate[key] || [];
  };

  const getDayTotal = (entries) => {
    return entries.reduce((sum, e) => {
      const amount = e.invoiceAmount || e.payableAmount || e.refundAmount || e.amount || 0;
      return sum + amount;
    }, 0);
  };

  const selectedEntries = selectedDate ? getDayEntries(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
        <p className="text-sm text-gray-500 mt-1">View entries by date</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, isCurrentMonth }, index) => {
                const entries = getDayEntries(date);
                const hasEntries = entries.length > 0;
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      min-h-[80px] p-2 rounded-lg border transition-all text-left
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${isSelected ? 'ring-2 ring-primary-500 border-primary-500' : 'border-gray-200'}
                      ${isToday ? 'bg-primary-50' : ''}
                      ${hasEntries ? 'hover:shadow-md' : 'hover:bg-gray-50'}
                    `}
                  >
                    <span className={`text-sm font-medium ${isToday ? 'text-primary-600' : ''}`}>
                      {date.getDate()}
                    </span>
                    {hasEntries && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary-100 text-primary-700">
                          {entries.length}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1 truncate">
                          {formatCurrency(getDayTotal(entries), false)}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Day Details */}
        <div>
          <Card>
            <CardHeader
              title={selectedDate ? formatDate(selectedDate, 'long') : 'Select a date'}
              subtitle={selectedEntries.length > 0 ? `${selectedEntries.length} entries` : undefined}
            />

            {!selectedDate ? (
              <p className="text-gray-500 text-center py-8">
                Click on a date to view entries
              </p>
            ) : selectedEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No entries for this date
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedEntries.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="primary" size="sm">
                        {MODULE_CONFIG[entry.module]?.icon} {MODULE_CONFIG[entry.module]?.label}
                      </Badge>
                      <span className="font-medium text-sm">
                        {formatCurrency(entry.invoiceAmount || entry.payableAmount || entry.refundAmount || entry.amount)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {entry.vendorName || entry.customerId || entry.driverName || entry.particulars || '-'}
                    </p>
                  </div>
                ))}

                <div className="pt-3 border-t mt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(getDayTotal(selectedEntries))}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
