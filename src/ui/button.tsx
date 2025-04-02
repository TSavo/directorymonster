import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'data-testid'?: string;
  [prop: string]: any;
}

// Simple mock implementation of a Button component
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  'data-testid': testId = 'category-filter-button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`ui-button ui-button-${variant} ui-button-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      {...props}
    >
      {children}
    </button>
  );
};

// Button with a different function name for named imports
export function Button2(props: ButtonProps) {
  return <Button {...props} />;
}

// Default export for default imports
export default Button;
