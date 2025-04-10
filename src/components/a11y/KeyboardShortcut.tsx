'use client';

import { useEffect, useCallback } from 'react';

type KeyCombination = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
};

type KeyboardShortcutProps = {
  combination: KeyCombination;
  onKeyDown: () => void;
  disabled?: boolean;
};

export default function KeyboardShortcut({
  combination,
  onKeyDown,
  disabled = false,
}: KeyboardShortcutProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      const { key, ctrlKey = false, altKey = false, shiftKey = false, metaKey = false } = combination;

      // Check if the key combination matches
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey &&
        event.metaKey === metaKey
      ) {
        // Prevent default browser behavior for this key combination
        event.preventDefault();
        onKeyDown();
      }
    },
    [combination, onKeyDown, disabled]
  );

  useEffect(() => {
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // This component doesn't render anything
  return null;
}

// Helper function to format keyboard shortcut for display
export function formatShortcut(combination: KeyCombination): string {
  const parts: string[] = [];
  
  if (combination.ctrlKey) parts.push('Ctrl');
  if (combination.altKey) parts.push('Alt');
  if (combination.shiftKey) parts.push('Shift');
  if (combination.metaKey) parts.push('⌘');
  
  // Format the key
  let key = combination.key;
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();
  else if (key === 'ArrowUp') key = '↑';
  else if (key === 'ArrowDown') key = '↓';
  else if (key === 'ArrowLeft') key = '←';
  else if (key === 'ArrowRight') key = '→';
  
  parts.push(key);
  
  return parts.join(' + ');
}
