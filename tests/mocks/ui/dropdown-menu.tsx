import React from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
  [prop: string]: any;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [prop: string]: any;
}

// Mock implementation of DropdownMenu component
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ui-dropdown ${className}`}
      data-testid="dropdown-menu"
      {...props}
    >
      {children}
    </div>
  );
};

// Mock implementation of DropdownMenuItem component
export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <div
      className={`ui-dropdown-item ${className}`}
      onClick={onClick}
      data-testid="dropdown-menu-item"
      {...props}
    >
      {children}
    </div>
  );
};

// Export named components
export { DropdownMenuItem as Item };