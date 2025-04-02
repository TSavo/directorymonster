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

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
  [prop: string]: any;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  [prop: string]: any;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
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

// Mock implementation of DropdownMenuTrigger component
export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  asChild,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ui-dropdown-trigger ${className}`}
      data-testid="dropdown-menu-trigger"
      {...props}
    >
      {children}
    </div>
  );
};

// Mock implementation of DropdownMenuContent component
export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = 'center',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ui-dropdown-content ${className}`}
      data-testid="dropdown-menu-content"
      data-align={align}
      {...props}
    >
      {children}
    </div>
  );
};

// Mock implementation of DropdownMenuLabel component
export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ui-dropdown-label ${className}`}
      data-testid="dropdown-menu-label"
      {...props}
    >
      {children}
    </div>
  );
};

// Mock implementation of DropdownMenuSeparator component
export const DropdownMenuSeparator: React.FC = () => {
  return <hr data-testid="dropdown-menu-separator" />;
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