import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className = '' }) => {
  return <div className={`ui-dropdown ${className}`} data-testid="dropdown-menu">{children}</div>;
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild, className = '' }) => {
  return <div className={`ui-dropdown-trigger ${className}`} data-testid="dropdown-menu-trigger">{children}</div>;
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ children, align = 'center', className = '' }) => {
  return (
    <div
      className={`ui-dropdown-content ${className}`}
      data-testid="dropdown-menu-content"
      data-align={align}
    >
      {children}
    </div>
  );
};

export const DropdownMenuLabel: React.FC<DropdownMenuLabelProps> = ({ children, className = '' }) => {
  return <div className={`ui-dropdown-label ${className}`} data-testid="dropdown-menu-label">{children}</div>;
};

export const DropdownMenuSeparator: React.FC = () => {
  return <hr data-testid="dropdown-menu-separator" />;
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className = '' }) => {
  return (
    <div
      className={`ui-dropdown-item ${className}`}
      onClick={onClick}
      data-testid="dropdown-menu-item"
    >
      {children}
    </div>
  );
};

export default DropdownMenu;