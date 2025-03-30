"use client";

import React from 'react';

export interface CheckboxOption<T extends string> {
  value: T;
  label: string;
}

interface FilterCheckboxGroupProps<T extends string> {
  title: string;
  options: CheckboxOption<T>[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
}

export function FilterCheckboxGroup<T extends string>({
  title,
  options,
  selectedValues,
  onChange,
}: FilterCheckboxGroupProps<T>) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as T;
    if (e.target.checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  return (
    <fieldset className="mb-4">
      <legend className="text-sm font-medium text-gray-700 mb-2">{title}</legend>
      <div className="space-y-2">
        {options.map(option => (
          <div key={option.value} className="flex items-center">
            <input
              id={`option-${option.value}`}
              name={option.value}
              type="checkbox"
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              data-testid={`filter-${option.value}`}
            />
            <label htmlFor={`option-${option.value}`} className="ml-2 block text-sm text-gray-700">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default FilterCheckboxGroup;