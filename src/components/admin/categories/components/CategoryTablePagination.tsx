'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryTablePaginationProps } from '../types';

/**
 * Pagination controls for the category table
 */
export default function CategoryTablePagination({
  currentPage,
  totalPages,
  goToPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems
}: CategoryTablePaginationProps) {
  // Calculate showing X to Y of Z items
  const startItem = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
      <div className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalItems} categories
      </div>
      
      <div className="flex items-center gap-2">
        {/* Items per page dropdown */}
        <div className="flex items-center mr-4">
          <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-600">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            aria-label="Items per page"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        
        {/* Previous page button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        
        {/* Page indicator */}
        <span className="px-2 text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        
        {/* Next page button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
