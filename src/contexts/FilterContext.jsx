import React, { createContext, useContext, useState, useCallback } from 'react';
import storageService from '../services/storageService';

const FilterContext = createContext(null);

/**
 * Filter Provider - Manages global filter state
 */
export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({});

  /**
   * Get filters for a specific module
   * @param {string} module - Module name
   * @returns {object} Filter state for module
   */
  const getModuleFilters = useCallback((module) => {
    // Try memory first, then localStorage
    if (filters[module]) {
      return filters[module];
    }
    return storageService.getModuleFilters(module);
  }, [filters]);

  /**
   * Set filters for a specific module
   * @param {string} module - Module name
   * @param {object} filterState - New filter state
   */
  const setModuleFilters = useCallback((module, filterState) => {
    setFilters((prev) => ({
      ...prev,
      [module]: filterState,
    }));
    // Persist to localStorage
    storageService.setModuleFilters(module, filterState);
  }, []);

  /**
   * Clear filters for a specific module
   * @param {string} module - Module name
   */
  const clearModuleFilters = useCallback((module) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[module];
      return newFilters;
    });
    storageService.setModuleFilters(module, {});
  }, []);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Update a single filter value for a module
   * @param {string} module - Module name
   * @param {string} key - Filter key
   * @param {*} value - Filter value
   */
  const updateFilter = useCallback((module, key, value) => {
    setFilters((prev) => {
      const moduleFilters = prev[module] || {};
      const newModuleFilters = { ...moduleFilters, [key]: value };
      storageService.setModuleFilters(module, newModuleFilters);
      return {
        ...prev,
        [module]: newModuleFilters,
      };
    });
  }, []);

  const value = {
    filters,
    getModuleFilters,
    setModuleFilters,
    clearModuleFilters,
    clearAllFilters,
    updateFilter,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Hook to use filter context
 * @returns {object} Filter context value
 */
export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;
