'use client';

import React from 'react';
import { StatusMessageProps } from './types';

/**
 * Component to display status messages (error or success)
 */
export function StatusMessage({ error, success, isEditMode }: StatusMessageProps) {
  if (!error && !success) {
    return null;
  }
  
  return (
    <>
      {/* Error message */}
      {error && (
        <div 
          className="p-4 bg-red-50 border border-red-200 rounded-md" 
          data-testid="category-form-error"
        >
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div 
          className="p-4 bg-green-50 border border-green-200 rounded-md" 
          data-testid="category-form-success"
        >
          <p className="text-green-700">
            Category {isEditMode ? 'updated' : 'created'} successfully. Redirecting...
          </p>
        </div>
      )}
    </>
  );
}

export default StatusMessage;
