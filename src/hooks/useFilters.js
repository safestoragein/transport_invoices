import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFilterContext } from '../contexts/FilterContext';
import { parseDate } from '../utils/formatters';

/**
 * Custom hook for filtering data
 * @param {Array} data - Data to filter
 * @param {object} options - Filter options
 */
const useFilters = (data = [], options = {}) => {
  const {
    moduleName,
    searchFields = [],
    dateField = 'invoiceDate',
    amountField = 'amount',
    persistFilters = true,
  } = options;

  const { getModuleFilters, setModuleFilters } = useFilterContext();

  // Always default to showing pending_approval entries on load
  const [filters, setFilters] = useState(() => {
    const saved = (persistFilters && moduleName) ? getModuleFilters(moduleName) : {};
    return { ...saved, paymentStatus: 'Pending' };
  });

  // Persist filters when they change
  useEffect(() => {
    if (persistFilters && moduleName) {
      setModuleFilters(moduleName, filters);
    }
  }, [filters, moduleName, persistFilters, setModuleFilters]);

  /**
   * Update a single filter
   */
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Update multiple filters at once
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Clear a single filter
   */
  const clearFilter = useCallback((key) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  /**
   * Get unique values for a field (for dropdowns)
   */
  const getUniqueValues = useCallback((field) => {
    const values = new Set();
    data.forEach((item) => {
      if (item[field]) {
        values.add(item[field]);
      }
    });
    return Array.from(values).sort();
  }, [data]);

  /**
   * Apply filters to data
   */
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter((item) => {
      // Text search filter
      if (filters.search && searchFields.length > 0) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = searchFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        const itemDate = parseDate(item[dateField]);

        if (itemDate) {
          if (start) {
            const startDate = new Date(start);
            startDate.setHours(0, 0, 0, 0);
            if (itemDate < startDate) return false;
          }
          if (end) {
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);
            if (itemDate > endDate) return false;
          }
        } else if (start || end) {
          // If date filter is set but item has no valid date, exclude it
          return false;
        }
      }

      // Amount range filter
      if (filters.amountRange) {
        const { min, max } = filters.amountRange;
        const amount = Number(item[amountField]) || 0;

        if (min !== '' && min !== undefined && amount < Number(min)) return false;
        if (max !== '' && max !== undefined && amount > Number(max)) return false;
      }

      // Status filter (supports multi-select)
      if (filters.status) {
        if (Array.isArray(filters.status) && filters.status.length > 0) {
          if (!filters.status.includes(item.status)) return false;
        } else if (typeof filters.status === 'string' && filters.status !== '') {
          if (item.status !== filters.status) return false;
        }
      }

      // Payment status filter
      if (filters.paymentStatus) {
        if (Array.isArray(filters.paymentStatus) && filters.paymentStatus.length > 0) {
          if (!filters.paymentStatus.includes(item.paymentStatus)) return false;
        } else if (typeof filters.paymentStatus === 'string' && filters.paymentStatus !== '') {
          if (item.paymentStatus !== filters.paymentStatus) return false;
        }
      }

      // Management approval filter
      if (filters.managerApproval && filters.managerApproval !== '') {
        if (item.managerApproval !== filters.managerApproval) return false;
      }

      // Vendor filter
      if (filters.vendor && filters.vendor !== '') {
        if (item.vendorName !== filters.vendor) return false;
      }

      // City filter
      if (filters.city && filters.city !== '') {
        if (item.city !== filters.city) return false;
      }

      // Month filter
      if (filters.month && filters.month !== '') {
        const itemDate = parseDate(item[dateField]);
        if (itemDate) {
          const monthYear = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
          if (monthYear !== filters.month) return false;
        }
      }

      // Custom filters (key-value pairs)
      if (filters.custom) {
        for (const [key, value] of Object.entries(filters.custom)) {
          if (value !== '' && value !== undefined) {
            if (item[key] !== value) return false;
          }
        }
      }

      return true;
    });
  }, [data, filters, searchFields, dateField, amountField]);

  /**
   * Get available months from data
   */
  const availableMonths = useMemo(() => {
    const months = new Set();
    data.forEach((item) => {
      const date = parseDate(item[dateField]);
      if (date) {
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
      }
    });
    return Array.from(months).sort().reverse();
  }, [data, dateField]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some((v) => v !== '' && v !== undefined);
      }
      return value !== '' && value !== undefined;
    });
  }, [filters]);

  /**
   * Count active filters
   */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === 'object' && value !== null) {
        if (Object.values(value).some((v) => v !== '' && v !== undefined)) count++;
      } else if (value !== '' && value !== undefined) count++;
    });
    return count;
  }, [filters]);

  return {
    // State
    filters,
    filteredData,
    hasActiveFilters,
    activeFilterCount,
    availableMonths,
    // Actions
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    setFilters,
    // Utilities
    getUniqueValues,
    // Stats
    totalCount: data.length,
    filteredCount: filteredData.length,
  };
};

export default useFilters;
