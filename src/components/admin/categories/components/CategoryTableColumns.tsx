'use client';

import React from 'react';
import { SortField, SortOrder } from '../types';
import { CategoryTableSortHeader } from './CategoryTableSortHeader';

interface CategoryTableColumnsProps {
  showSiteColumn: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

/**
 * Component for category table column headers
 */
export function CategoryTableColumns({
  showSiteColumn,
  sortField,
  sortOrder,
  onSort
}: CategoryTableColumnsProps) {
  return (
    <tr>
      <CategoryTableSortHeader
        label="Order"
        field="order"
        currentSortField={sortField}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
      <CategoryTableSortHeader
        label="Name"
        field="name"
        currentSortField={sortField}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
      {showSiteColumn && (
        <th 
          scope="col" 
          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          data-testid="category-table-header-site"
        >
          Site
        </th>
      )}
      <CategoryTableSortHeader
        label="Last Updated"
        field="updatedAt"
        currentSortField={sortField}
        currentSortOrder={sortOrder}
        onSort={onSort}
      />
      <th 
        scope="col" 
        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
        data-testid="category-table-header-actions"
      >
        Actions
      </th>
    </tr>
  );
}

export default CategoryTableColumns;
