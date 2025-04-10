'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface FormActionsProps {
  /**
   * Is this the first step
   */
  isFirstStep: boolean;
  /**
   * Is this the last step
   */
  isLastStep: boolean;
  /**
   * Is the form in a loading state
   */
  isLoading: boolean;
  /**
   * Handler for previous step button
   */
  onPrevious: () => void;
  /**
   * Handler for next step button
   */
  onNext: () => void;
  /**
   * Handler for cancel button
   */
  onCancel: () => void;
  /**
   * Form mode (create or edit)
   */
  mode?: 'create' | 'edit';
}

/**
 * FormActions - Navigation buttons for multi-step forms
 *
 * Provides back, next, and submit buttons
 */
export const FormActions: React.FC<FormActionsProps> = ({
  isFirstStep,
  isLastStep,
  isLoading,
  onPrevious,
  onNext,
  onCancel,
  mode = 'create'
}) => {
  return (
    <div className="flex justify-between mt-8" data-testid="form-actions">
      <div className="flex justify-start">
        {!isFirstStep && (
          <Button
            type="button"
            onClick={onPrevious}
            variant="ghost"
            data-testid="form-back-button"
            isLoading={isLoading}
          >
            ← Back
          </Button>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          data-testid="cancel-button"
          isLoading={isLoading}
        >
          Cancel
        </Button>

        {isLastStep ? (
          <Button
            type="submit"
            variant="primary"
            data-testid="submit-site-button"
            isLoading={isLoading}
          >
            {mode === 'edit' ? 'Update Site' : 'Create Site'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            variant="primary"
            data-testid="next-button"
            isLoading={isLoading}
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormActions;