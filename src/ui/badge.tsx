import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

// Simple mock implementation of a Badge component
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  'data-testid': testId = 'ui-badge',
}) => {
  return (
    <span
      className={`ui-badge ui-badge-${variant} ${className}`}
      data-testid={testId}
      onClick={onClick}
    >
      {children}
    </span>
  );
};

export default Badge;