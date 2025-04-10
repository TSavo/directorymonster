'use client';

import React from 'react';
import { FormActionsProps } from './types';
import { Button } from '@/components/ui/Button';

/**
 * Form action buttons component
 */
export function FormActions({ isLoading, isEditMode, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3" data-testid="category-form-actions">
      <Button
        type="button"
        onClick={onCancel}
        variant="secondary"
        isLoading={isLoading}
        data-testid="category-form-cancel"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        isLoading={isLoading}
        data-testid="category-form-submit"
      >
        {isEditMode ? 'Update Category' : 'Create Category'}
      </Button>
    </div>
  );
}

export default FormActions;
