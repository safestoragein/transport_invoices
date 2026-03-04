import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button';

/**
 * FilterBar component - Advanced filter controls
 */
const FilterBar = ({
  filters = [],
  values = {},
  onChange,
  onClear,
  onApply,
  collapsible = true,
  defaultExpanded = false,
  showClearButton = true,
  showApplyButton = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localValues, setLocalValues] = useState(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(localValues).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
      }
      return value !== '' && value !== null && value !== undefined;
    });
  }, [localValues]);

  const handleChange = (name, value) => {
    const newValues = { ...localValues, [name]: value };
    setLocalValues(newValues);
    if (!showApplyButton) {
      onChange?.(newValues);
    }
  };

  const handleClear = () => {
    const clearedValues = {};
    filters.forEach(filter => {
      clearedValues[filter.name] = filter.type === 'dateRange' ? { start: '', end: '' } :
                                   filter.type === 'amountRange' ? { min: '', max: '' } :
                                   filter.type === 'multiSelect' ? [] : '';
    });
    setLocalValues(clearedValues);
    onChange?.(clearedValues);
    onClear?.();
  };

  const handleApply = () => {
    onChange?.(localValues);
    onApply?.(localValues);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(localValues).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === 'object' && value !== null) {
        if (Object.values(value).some(v => v !== '' && v !== null && v !== undefined)) count++;
      } else if (value !== '' && value !== null && value !== undefined) count++;
    });
    return count;
  }, [localValues]);

  const renderFilter = (filter) => {
    const value = localValues[filter.name];

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={filter.placeholder || `Search ${filter.label}...`}
            value={value || ''}
            onChange={(e) => handleChange(filter.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(filter.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
          >
            <option value="">{filter.placeholder || `All ${filter.label}`}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiSelect':
        return (
          <div className="relative">
            <select
              multiple
              value={value || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                handleChange(filter.name, selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500 min-h-[80px]"
            >
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {value?.length > 0 && (
              <span className="absolute top-1 right-1 bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                {value.length}
              </span>
            )}
          </div>
        );

      case 'dateRange':
        const dateValue = value || { start: '', end: '' };
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dateValue.start || ''}
              onChange={(e) => handleChange(filter.name, { ...dateValue, start: e.target.value })}
              className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
            <span className="hidden sm:flex items-center text-gray-400 text-xs flex-shrink-0">to</span>
            <input
              type="date"
              value={dateValue.end || ''}
              onChange={(e) => handleChange(filter.name, { ...dateValue, end: e.target.value })}
              className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>
        );

      case 'amountRange':
        const amountValue = value || { min: '', max: '' };
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              placeholder="Min"
              value={amountValue.min || ''}
              onChange={(e) => handleChange(filter.name, { ...amountValue, min: e.target.value })}
              className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
            <span className="hidden sm:flex items-center text-gray-400 text-xs flex-shrink-0">to</span>
            <input
              type="number"
              placeholder="Max"
              value={amountValue.max || ''}
              onChange={(e) => handleChange(filter.name, { ...amountValue, max: e.target.value })}
              className="w-full sm:flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-card overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium text-gray-700">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
              {activeFilterCount} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showClearButton && hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              Clear
            </Button>
          )}
          {collapsible && (
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Filter Fields */}
      {(!collapsible || isExpanded) && (
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-3">
            {filters.map((filter) => (
              <div
                key={filter.name}
                className={
                  filter.type === 'dateRange' || filter.type === 'amountRange'
                    ? 'sm:col-span-2 lg:col-span-1'
                    : ''
                }
              >
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>

          {showApplyButton && (
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
              <Button variant="primary" size="sm" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * QuickFilter - Inline filter buttons
 */
export const QuickFilter = ({ options = [], value, onChange, label, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className}`}>
      {label && <span className="text-sm text-gray-600 flex-shrink-0">{label}:</span>}
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${value === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 text-xs opacity-70">({option.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * SearchInput - Debounced search input
 */
export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default FilterBar;
