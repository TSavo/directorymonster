"use client";

import React from 'react';

export interface CheckboxOption {
  id: string;
  label: string;
}

interface FilterCheckboxGroupProps {
  title: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FilterCheckboxGroup({
  title,
  options,
  selected,
  onChange,
}: FilterCheckboxGroupProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter(v => v !== value));
    }
  };

  return (
    <fieldset className="mb-4">
      <legend className="text-sm font-medium text-gray-700 mb-2">{title}</legend>
      <div className="space-y-2">
        {options.map(option => (
          <div key={option.id} className="flex items-center">
            <input
              id={`option-${option.id}`}
              name={option.id}
              type="checkbox"
              value={option.id}
              checked={selected.includes(option.id)}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              data-testid={`filter-${option.id}`}
              aria-label={option.label}
            />
            <label htmlFor={`option-${option.id}`} className="ml-2 block text-sm text-gray-700">
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default FilterCheckboxGroup;