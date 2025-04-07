import React from 'react';

export const Switch = ({ checked, onCheckedChange, disabled, className, ...props }: any) => (
  <button
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    className={`switch ${checked ? 'switch-checked' : ''} ${disabled ? 'switch-disabled' : ''} ${className || ''}`}
    onClick={() => onCheckedChange && onCheckedChange(!checked)}
    {...props}
  />
);
