import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: string;
  label?: string;
}

// Simple mock implementation of an Input component
export const Input: React.FC<InputProps> = ({
  className = '',
  type = 'text',
  error,
  label,
  ...props
}) => {
  return (
    <div className="ui-input-wrapper">
      {label && <label className="ui-input-label">{label}</label>}
      <input
        type={type}
        className={`ui-input ${error ? 'ui-input-error' : ''} ${className}`}
        data-testid="ui-input"
        {...props}
      />
      {error && <span className="ui-input-error-message">{error}</span>}
    </div>
  );
};

// Default export for default imports
export default Input;
