'use client';

import React from 'react';
import Link from 'next/link';
import { CategoryTableActionsProps } from '../types';

/**
 * Actions component for category table rows
 */
export function CategoryTableActions({
  id,
  name,
  siteSlug,
  onEditClick,
  onDeleteClick,
  onViewClick
}: CategoryTableActionsProps) {
  return (
    <div className="flex justify-end space-x-2" data-testid={`category-actions-${id}`}>
      <button
        type="button"
        onClick={() => onViewClick(id)}
        className="text-gray-500 hover:text-blue-600 transition-colors"
        title={`View ${name}`}
        data-testid={`category-view-${id}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="sr-only">View</span>
      </button>
      
      <button
        type="button"
        onClick={() => onEditClick(id)}
        className="text-gray-500 hover:text-indigo-600 transition-colors"
        title={`Edit ${name}`}
        data-testid={`category-edit-${id}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="sr-only">Edit</span>
      </button>
      
      <button
        type="button"
        onClick={() => onDeleteClick(id, name)}
        className="text-gray-500 hover:text-red-600 transition-colors"
        title={`Delete ${name}`}
        data-testid={`category-delete-${id}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span className="sr-only">Delete</span>
      </button>
    </div>
  );
}

export default CategoryTableActions;
