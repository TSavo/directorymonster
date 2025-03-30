'use client';

import React from 'react';

export interface SiteTablePaginationProps {
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Current page
   */
  currentPage: number;
  /**
   * Items per page
   */
  pageSize: number;
  /**
   * Handler for page change
   */
  onPageChange: (page: number) => void;
  /**
   * Handler for page size change
   */
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * SiteTablePagination - Pagination controls for the site table
 * 
 * Handles pagination and page size changes
 */
export const SiteTablePagination: React.FC<SiteTablePaginationProps> = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Calculate start and end items on the current page
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  // Generate page links to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    // Calculate range to display
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    // Adjust if we're near the end
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Generate page buttons
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 py-3" data-testid="site-table-pagination">
      {/* Items per page selector */}
      <div className="mb-3 sm:mb-0">
        <label className="text-sm text-gray-600 mr-2">
          Items per page:
        </label>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded p-1"
          data-testid="page-size-select"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
      
      {/* Pagination info */}
      <div className="text-sm text-gray-600 mb-3 sm:mb-0">
        Showing <span className="font-medium">{totalItems > 0 ? startItem : 0}</span>
        {' '} to <span className="font-medium">{endItem}</span>
        {' '} of <span className="font-medium">{totalItems}</span> sites
      </div>
      
      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-1 rounded ${
            currentPage <= 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
          aria-label="Previous page"
          data-testid="previous-page-button"
        >
          &laquo;
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
            data-testid={`page-button-${page}`}
          >
            {page}
          </button>
        ))}
        
        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1 rounded ${
            currentPage >= totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:bg-blue-50'
          }`}
          aria-label="Next page"
          data-testid="next-page-button"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

export default SiteTablePagination;