import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  'data-testid'?: string;
  [prop: string]: any;
}

// Mock implementation of Button component
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  type = 'button',
  'data-testid': dataTestId = 'ui-button',
  ...props
}) => {
  // Filter out any props that aren't valid for DOM elements
  const validProps = Object.entries(props).reduce((acc, [key, value]) => {
    if (typeof value !== 'function' && typeof value !== 'object') {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <button
      type={type}
      className={`ui-button ui-button-${variant} ui-button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      data-testid={dataTestId}
      {...validProps}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {isLoading ? (loadingText || 'Loading...') : children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

// Default export
export default Button;