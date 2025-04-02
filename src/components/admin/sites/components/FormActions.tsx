'use client';

import React from 'react';

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
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded focus:outline-none focus:ring-2"
            data-testid="back-button"
            disabled={isLoading}
          >
            ← Back
          </button>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring-2"
          data-testid="cancel-button"
          disabled={isLoading}
        >
          Cancel
        </button>

        {isLastStep ? (
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50"
            data-testid="next-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span data-testid="submit-loading">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              mode === 'edit' ? `Update Site` : `Create Site`
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50"
            data-testid="next-button"
            disabled={isLoading}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default FormActions;