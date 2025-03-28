'use client';

import React from 'react';
import Link from 'next/link';
import { CategoryTableRowProps, SortField } from '../types';

export default function CategoryTableRow({
  category,
  showSiteColumn,
  onDeleteClick,
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
  
  // Determine URL patterns based on siteSlug
  const viewUrl = category.siteSlug 
    ? `/admin/sites/${category.siteSlug}/categories/${category.slug}`
    : `/admin/categories/${category.id}`;
    
  const editUrl = category.siteSlug 
    ? `/admin/sites/${category.siteSlug}/categories/${category.id}/edit`
    : `/admin/categories/${category.id}/edit`;
  
  // Handle delete action
  const handleDelete = () => {
    onDeleteClick(category.id, category.name);
  };
  
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
    >
      {/* Order column */}
      <td className={`px-4 py-3 text-sm text-gray-500 ${isSortedByOrder ? 'bg-blue-50' : ''}`}
        aria-sort={isSortedByOrder ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
      >
        {category.order}
      </td>
      
      {/* Name column with hierarchical display */}
      <td className={`px-4 py-3 ${indentationClass} ${isSortedByName ? 'bg-blue-50' : ''}`}
        aria-sort={isSortedByName ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
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
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {category.childCount}
            </span>
          )}
        </div>
      </td>
      
      {/* Site column (conditional) */}
      {showSiteColumn && (
        <td className="px-4 py-3 text-sm text-gray-500">
          {category.siteName}
        </td>
      )}
      
      {/* Last updated column */}
      <td className={`px-4 py-3 text-sm text-gray-500 ${isSortedByUpdatedAt ? 'bg-blue-50' : ''}`}
        aria-sort={isSortedByUpdatedAt ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
      >
        {formattedDate}
      </td>
      
      {/* Actions column */}
      <td className="px-4 py-3 text-sm text-right">
        <div className="flex justify-end space-x-2">
          <Link
            href={viewUrl}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            View
          </Link>
          
          <Link
            href={editUrl}
            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
          >
            Edit
          </Link>
          
          <button
            onClick={handleDelete}
            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            aria-label={`Delete ${category.name}`}
            data-testid={`delete-button-${category.id}`}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
