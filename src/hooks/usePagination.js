import { useState, useMemo, useCallback } from 'react';
import { PAGINATION } from '../utils/constants';

/**
 * Custom hook for pagination
 * @param {Array} data - Data to paginate
 * @param {object} options - Pagination options
 */
const usePagination = (data = [], options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / pageSize);
  }, [data.length, pageSize]);

  /**
   * Get paginated data
   */
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  /**
   * Go to first page
   */
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Go to last page
   */
  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Change page size
   */
  const changePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  }, []);

  /**
   * Get page numbers for pagination UI
   */
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  /**
   * Calculate showing range
   */
  const showingRange = useMemo(() => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, data.length);
    return { start, end, total: data.length };
  }, [currentPage, pageSize, data.length]);

  /**
   * Check navigation states
   */
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    // State
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    pageNumbers,
    showingRange,
    // Navigation
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
    reset,
    // Flags
    canGoNext,
    canGoPrev,
    // Raw setters
    setCurrentPage,
    setPageSize,
  };
};

export default usePagination;
