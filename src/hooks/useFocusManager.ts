'use client';

import { useRef, useCallback } from 'react';

export default function useFocusManager() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && 'focus' in previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, []);

  const focusFirst = useCallback((container: HTMLElement | null) => {
    if (!container) return false;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }

    return false;
  }, []);

  const focusLast = useCallback((container: HTMLElement | null) => {
    if (!container) return false;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }

    return false;
  }, []);

  const focusById = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    focusById,
  };
}
