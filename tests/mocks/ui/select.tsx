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
export const Select = ({
  className = '',
  options = [],
  error,
  label,
  children,
  value,
  onValueChange,
  disabled = false,
  id,
  ...props
}: any) => {
  return (
    <div className="ui-select-wrapper" data-testid="select" data-value={value} data-disabled={disabled}>
      {label && <label className="ui-select-label" htmlFor={id}>{label}</label>}
      <select
        className={`ui-select ${error ? 'ui-select-error' : ''} ${className}`}
        data-testid="ui-select"
        value={value}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
        disabled={disabled}
        id={id}
        {...props}
      >
        {options.length > 0 ? (
          options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : null}
      </select>
      {error && <span className="ui-select-error-message">{error}</span>}
    </div>
  );
};

export const SelectTrigger = ({ children, id }: any) => {
  return (
    <div data-testid="select-trigger" id={id}>
      {children}
    </div>
  );
};

export const SelectValue = ({ placeholder, children }: any) => {
  return (
    <div data-testid="select-value" data-placeholder={placeholder}>
      {children || placeholder}
    </div>
  );
};

export const SelectContent = ({ children }: any) => {
  return (
    <div data-testid="select-content">
      {children}
    </div>
  );
};

export const SelectItem = ({ children, value }: any) => {
  return (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  );
};

export const SelectGroup = ({ children }: any) => {
  return (
    <div data-testid="select-group">
      {children}
    </div>
  );
};

export const SelectLabel = ({ children }: any) => {
  return (
    <div data-testid="select-label">
      {children}
    </div>
  );
};

// Default export
export default Select;