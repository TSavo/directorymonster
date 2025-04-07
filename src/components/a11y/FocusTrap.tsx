'use client';

import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  autoFocus?: boolean;
  returnFocusOnDeactivate?: boolean;
}

export default function FocusTrap({
  children,
  isActive = true,
  autoFocus = true,
  returnFocusOnDeactivate = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element when the trap becomes active
  useEffect(() => {
    if (isActive && returnFocusOnDeactivate) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isActive, returnFocusOnDeactivate]);

  // Auto-focus the first focusable element when the trap becomes active
  useEffect(() => {
    if (!isActive || !autoFocus || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [isActive, autoFocus]);

  // Return focus to the previously focused element when the trap is deactivated
  useEffect(() => {
    return () => {
      if (returnFocusOnDeactivate && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [returnFocusOnDeactivate]);

  // Handle tab key to keep focus within the container
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isActive || !containerRef.current || e.key !== 'Tab') return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    // If shift+tab on first element, move to last element
    if (e.shiftKey && activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // If tab on last element, move to first element
    else if (!e.shiftKey && activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} data-testid="focus-trap">
      {children}
    </div>
  );
}
