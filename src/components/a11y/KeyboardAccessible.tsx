'use client';

import React, { forwardRef } from 'react';

interface KeyboardAccessibleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  role?: string;
  tabIndex?: number;
  className?: string;
}

const KeyboardAccessible = forwardRef<HTMLDivElement, KeyboardAccessibleProps>(
  ({ children, onClick, role = 'button', tabIndex = 0, className = '', ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Trigger click on Enter or Space
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick(event);
      }
    };

    return (
      <div
        ref={ref}
        role={role}
        tabIndex={tabIndex}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={className}
        data-testid="keyboard-accessible"
        {...props}
      >
        {children}
      </div>
    );
  }
);

KeyboardAccessible.displayName = 'KeyboardAccessible';

export default KeyboardAccessible;
