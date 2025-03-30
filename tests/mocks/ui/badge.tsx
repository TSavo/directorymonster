import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
  className?: string;
  [prop: string]: any;
}

// Mock implementation of Badge component
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <span
      className={`ui-badge ui-badge-${variant} ${className}`}
      data-testid="ui-badge"
      {...props}
    >
      {children}
    </span>
  );
};

// Default export
export default Badge;