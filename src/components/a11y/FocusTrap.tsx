'use client';

import React from 'react';
import { useFocusTrap } from './hooks/useFocusTrap';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  autoFocus?: boolean;
  returnFocusOnDeactivate?: boolean;
  className?: string;
}

/**
 * FocusTrap component that keeps focus within its children
 *
 * This component is useful for modals, dialogs, and other components that need to trap focus
 * for accessibility purposes.
 */
export default function FocusTrap({
  children,
  isActive = true,
  autoFocus = true,
  returnFocusOnDeactivate = true,
  className = '',
}: FocusTrapProps) {
  // Use the focus trap hook to handle focus management
  const { containerRef, handleKeyDown } = useFocusTrap({
    isActive,
    autoFocus,
    returnFocusOnDeactivate
  });

  // If not active, render children without the trap
  if (!isActive) {
    return <>{children}</>;
  }

  // Render the trap container with children
  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      data-testid="focus-trap"
      className={className}
    >
      {children}
    </div>
  );
}
