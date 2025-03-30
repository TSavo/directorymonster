import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: Array<{
    value: string;
    label: string;
  }>;
  className?: string;
  error?: string;
  label?: string;
}

// Mock implementation of Select component
export const Select: React.FC<SelectProps> = ({
  className = '',
  options = [],
  error,
  label,
  children,
  ...props
}) => {
  return (
    <div className="ui-select-wrapper">
      {label && <label className="ui-select-label">{label}</label>}
      <select
        className={`ui-select ${error ? 'ui-select-error' : ''} ${className}`}
        data-testid="ui-select"
        {...props}
      >
        {options.length > 0 ? (
          options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      {error && <span className="ui-select-error-message">{error}</span>}
    </div>
  );
};

// Default export
export default Select;