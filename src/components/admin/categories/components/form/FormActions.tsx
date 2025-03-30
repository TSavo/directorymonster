'use client';

import React from 'react';
import { FormActionsProps } from './types';

/**
 * Form action buttons component
 */
export function FormActions({ isLoading, isEditMode, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3" data-testid="category-form-actions">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={isLoading}
        data-testid="category-form-cancel"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={isLoading}
        data-testid="category-form-submit"
      >
        {isLoading 
          ? 'Saving...' 
          : isEditMode 
            ? 'Update Category' 
            : 'Create Category'
        }
      </button>
    </div>
  );
}

export default FormActions;
