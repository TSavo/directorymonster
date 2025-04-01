'use client';

import React from 'react';
import { CategoryTableRowProps } from '../types';
import { CategoryTableActions } from './CategoryTableActions';

export function CategoryTableRow({
  category,
  showSiteColumn,
  onDeleteClick,
  onEditClick,
  onViewClick,
  depth = 0,
  isLastChild = false,
  isDraggable = false,
  isSortedBy,
  sortDirection
}: CategoryTableRowProps) {
  // Calculate indentation based on depth
  const indentationClass = depth > 0
    ? `pl-${depth * 4}` // 1rem (4) per level of depth
    : '';

  // Format the date for display
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(category.updatedAt));

  // Determine if cell has active sorting
  const isSortedByName = isSortedBy === 'name';
  const isSortedByOrder = isSortedBy === 'order';
  const isSortedByCreatedAt = isSortedBy === 'createdAt';
  const isSortedByUpdatedAt = isSortedBy === 'updatedAt';

  return (
    <tr
      className={`
        border-b border-gray-200 hover:bg-gray-50 transition-colors
        ${isLastChild ? 'last-child-category' : ''}
      `}
      aria-label={`Category: ${category.name}`}
      {...(category.childCount > 0 ? {
        'aria-expanded': 'true',
        'aria-controls': `category-children-${category.id}`
      } : {})}
      data-testid={`category-row-${category.id}`}
    >
      {/* Order column */}
      <td className={`px-4 py-3 text-sm text-gray-500 ${isSortedByOrder ? 'bg-blue-50' : ''}`}
        aria-sort={isSortedByOrder ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
        data-testid={`category-order-${category.id}`}
      >
        {category.order}
      </td>

      {/* Name column with hierarchical display */}
      <td className={`px-4 py-3 ${indentationClass} ${isSortedByName ? 'bg-blue-50' : ''}`}
        aria-sort={isSortedByName ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
        data-testid={`category-name-cell-${category.id}`}
      >
        <div className="flex items-center">
          {/* Tree lines for child categories */}
          {depth > 0 && (
            <div
              className="h-full mr-2 border-l-2 border-gray-200"
              data-testid={`tree-line-${depth}`}
            />
          )}

          {/* Drag handle for reordering */}
          {isDraggable && (
            <button
              className="mr-2 text-gray-400 hover:text-gray-600"
              aria-label="Drag to reorder"
              data-testid={`drag-handle-${category.id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="5" r="1" />
                <circle cx="9" cy="12" r="1" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="15" cy="5" r="1" />
                <circle cx="15" cy="12" r="1" />
                <circle cx="15" cy="19" r="1" />
              </svg>
            </button>
          )}

          {/* Child indicator */}
          {depth > 0 && (
            <span
              className="mr-2 text-gray-400"
              data-testid="child-indicator"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          )}

          {/* Category name */}
          <div>
            <h3 className="font-medium text-gray-900" data-testid={`category-name-${category.id}`}>{category.name}</h3>

            {/* Parent name for child categories */}
            {category.parentName && (
              <div className="text-xs text-gray-500" data-testid={`parent-name-${category.id}`}>
                {category.parentName}
              </div>
            )}
          </div>

          {/* Child count badge */}
          {category.childCount > 0 && (
            <span
              className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
              data-testid={`child-count-${category.id}`}
            >
              {category.childCount}
            </span>
          )}
        </div>
      </td>

      {/* Site column (conditional) */}
      {showSiteColumn && (
        <td
          className="px-4 py-3 text-sm text-gray-500"
          data-testid={`category-site-${category.id}`}
        >
          {category.siteName}
        </td>
      )}

      {/* Last updated column */}
      <td
        className={`px-4 py-3 text-sm text-gray-500 ${isSortedByUpdatedAt ? 'bg-blue-50' : ''}`}
        aria-sort={isSortedByUpdatedAt ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
        data-testid={`category-updated-${category.id}`}
      >
        {formattedDate}
      </td>

      {/* Actions column */}
      <td className="px-4 py-3 text-sm text-right" data-testid={`category-actions-${category.id}`}>
        <CategoryTableActions
          id={category.id}
          name={category.name}
          siteSlug={category.siteSlug || category.siteId}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          onViewClick={onViewClick}
        />
      </td>
    </tr>
  );
}

// Add default export for dual-export pattern
export default CategoryTableRow;
