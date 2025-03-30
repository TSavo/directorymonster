'use client';

import React from 'react';
import { TextAreaProps } from './types';

/**
 * Reusable textarea component for multi-line text input
 */
export function TextArea({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  rows = 3,
  disabled,
  placeholder,
  helperText,
  testId = `category-form-${name}`
}: TextAreaProps) {
  const dataTestId = testId || `category-form-${name}`;
  const groupTestId = `${dataTestId}-group`;
  const errorTestId = `${dataTestId}-error`;
  const helperTestId = `${dataTestId}-helper`;
  
  return (
    <div data-testid={groupTestId}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={`mt-1 block w-full border ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        data-testid={dataTestId}
      ></textarea>
      {error && touched && (
        <p className="mt-1 text-sm text-red-600" data-testid={errorTestId}>
          {error}
        </p>
      )}
      {helperText && (
        <p className="mt-1 text-sm text-gray-500" data-testid={helperTestId}>
          {helperText}
        </p>
      )}
    </div>
  );
}

export default TextArea;
