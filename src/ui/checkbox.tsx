import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  error?: string;
  id?: string;
  'data-testid'?: string;
}

// Simple mock implementation of a Checkbox component
export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked = false,
  onChange,
  onCheckedChange,
  className = '',
  error,
  id,
  'data-testid': testId,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <div className={`ui-checkbox-wrapper ${className}`}>
      <label className="ui-checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className={`ui-checkbox ${error ? 'ui-checkbox-error' : ''}`}
          data-testid={testId || `category-checkbox-${id || 'default'}`}
          id={id}
          {...props}
        />
        {label && <span className="ui-checkbox-text">{label}</span>}
      </label>
      {error && <span className="ui-error-message">{error}</span>}
    </div>
  );
};

export default Checkbox;
