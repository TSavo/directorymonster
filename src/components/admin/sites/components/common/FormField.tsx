'use client';

import React from 'react';

export interface FormFieldProps {
  /**
   * Unique identifier for the field
   */
  id: string;
  /**
   * Label text for the field
   */
  label: string;
  /**
   * Name attribute for the field
   */
  name: string;
  /**
   * Current value of the field
   */
  value: string;
  /**
   * Handler for value changes
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /**
   * Type of input field
   * @default "text"
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Help text to display below the field
   */
  helpText?: string;
  /**
   * Number of rows for textarea
   * @default 3
   */
  rows?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * FormField - Reusable form field component
 * 
 * A flexible form field component that can render different types of inputs
 * with consistent styling and error handling.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  name,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  disabled = false,
  placeholder,
  helpText,
  rows = 3,
  className = ''
}) => {
  const hasError = !!error;
  const fieldId = `form-field-${id}`;
  const errorId = `${fieldId}-error`;
  const helpTextId = helpText ? `${fieldId}-help` : undefined;
  
  // Common props for both input and textarea
  const commonProps = {
    id: fieldId,
    name,
    value,
    onChange,
    disabled,
    placeholder,
    'aria-invalid': hasError ? 'true' : 'false',
    'aria-describedby': [
      hasError ? errorId : null,
      helpTextId
    ].filter(Boolean).join(' ') || undefined,
    className: `w-full p-2 border rounded focus:ring-2 focus:outline-none focus:border-blue-500 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`,
    'data-testid': fieldId
  };
  
  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          {...commonProps}
          rows={rows}
        />
      ) : (
        <input
          {...commonProps}
          type={type}
        />
      )}
      
      {helpText && (
        <p
          id={helpTextId}
          className="mt-1 text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
