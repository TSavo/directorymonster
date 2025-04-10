'use client';

import React from 'react';
import { PaginationContainer } from './PaginationContainer';

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
 * This component has been refactored to use a container/presentation pattern
 * for better testability and reusability.
 */
export const SiteTablePagination: React.FC<SiteTablePaginationProps> = (props) => {
  return (
    <PaginationContainer
      {...props}
      pageSizeOptions={[5, 10, 25, 50]}
      className="flex flex-col sm:flex-row items-center justify-between mt-4 py-3"
      data-testid="site-table-pagination"
    />
  );
};

export default SiteTablePagination;