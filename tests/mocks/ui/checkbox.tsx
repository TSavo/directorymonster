import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  error?: string;
  [prop: string]: any;
}

// Mock implementation of Checkbox component
export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className = '',
  error,
  id,
  ...props
}) => {
  const inputId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`ui-checkbox-wrapper ${className}`}>
      <div className="ui-checkbox-container">
        <input
          type="checkbox"
          id={inputId}
          className={`ui-checkbox ${error ? 'ui-checkbox-error' : ''}`}
          data-testid="ui-checkbox"
          {...props}
        />
        {label && (
          <label htmlFor={inputId} className="ui-checkbox-label">
            {label}
          </label>
        )}
      </div>
      {error && <span className="ui-checkbox-error-message">{error}</span>}
    </div>
  );
};

// Default export
export default Checkbox;