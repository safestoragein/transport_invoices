import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const colorStyles = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'bg-primary-100 text-primary-600',
    text: 'text-primary-600',
  },
  success: {
    bg: 'bg-success-50',
    icon: 'bg-success-100 text-success-600',
    text: 'text-success-600',
  },
  danger: {
    bg: 'bg-danger-50',
    icon: 'bg-danger-100 text-danger-600',
    text: 'text-danger-600',
  },
  warning: {
    bg: 'bg-warning-50',
    icon: 'bg-warning-100 text-warning-600',
    text: 'text-warning-600',
  },
  neutral: {
    bg: 'bg-gray-50',
    icon: 'bg-gray-100 text-gray-600',
    text: 'text-gray-600',
  },
};

/**
 * StatCard component - Display statistics with icon
 */
export const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  trendValue,
  isCurrency = false,
  subtitle,
  className = '',
}) => {
  const colors = colorStyles[color] || colorStyles.primary;

  const displayValue = isCurrency ? formatCurrency(value) : value;

  return (
    <div
      className={`
        bg-white rounded-xl shadow-card p-5
        hover:shadow-hover transition-shadow duration-200
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${colors.text}`}>
            {displayValue}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colors.icon}`}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center">
          <span
            className={`
              inline-flex items-center text-sm font-medium
              ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}
            `}
          >
            {trend >= 0 ? (
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
          {trendValue && (
            <span className="text-gray-400 text-sm ml-2">{trendValue}</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * StatCardGrid - Grid layout for multiple stat cards
 */
export const StatCardGrid = ({ children, columns = 4, className = '' }) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns] || gridCols[4]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * MiniStatCard - Compact version for inline stats
 */
export const MiniStatCard = ({ label, value, color = 'primary', isCurrency = false }) => {
  const colors = colorStyles[color] || colorStyles.primary;
  const displayValue = isCurrency ? formatCurrency(value) : value;

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-lg ${colors.bg}`}>
      <span className="text-sm text-gray-600 mr-2">{label}:</span>
      <span className={`font-semibold ${colors.text}`}>{displayValue}</span>
    </div>
  );
};

// Default export for backwards compatibility
export default StatCard;
