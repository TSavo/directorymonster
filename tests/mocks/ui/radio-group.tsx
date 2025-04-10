import React from 'react';

export const RadioGroup = ({ value, onValueChange, children }: any) => (
  <div data-testid="radio-group">
    {React.Children.map(children, (child) => 
      React.cloneElement(child, { 
        checked: child.props.value === value,
        onChange: () => onValueChange && onValueChange(child.props.value)
      })
    )}
  </div>
);

export const RadioGroupItem = ({ value, checked, onChange, children }: any) => (
  <div data-testid={`radio-group-item-${value}`}>
    <input 
      type="radio" 
      value={value} 
      checked={checked} 
      onChange={onChange}
      data-testid={`radio-input-${value}`}
    />
    {children}
  </div>
);
