'use client';

import React from 'react';
import { SelectFieldProps } from './types';

/**
 * Reusable select field component
 */
export function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  options,
  loading,
  disabled,
  helperText,
  testId = `category-form-${name}`
}: SelectFieldProps) {
  const dataTestId = testId || `category-form-${name}`;
  const groupTestId = `${dataTestId}-group`;
  const errorTestId = `${dataTestId}-error`;
  const helperTestId = `${dataTestId}-helper`;
  
  return (
    <div data-testid={groupTestId}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled || loading}
        className={`mt-1 block w-full border ${
          error && touched ? 'border-red-500' : 'border-gray-300'
        } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          disabled || loading ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        data-testid={dataTestId}
      >
        {loading ? (
          <option value="" disabled>Loading...</option>
        ) : (
          <>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
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

export default SelectField;
