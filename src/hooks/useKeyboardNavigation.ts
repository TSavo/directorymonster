'use client';

import { useCallback, useEffect, useState } from 'react';

type KeyboardNavigationOptions = {
  vertical?: boolean;
  horizontal?: boolean;
  loopNavigation?: boolean;
  initialIndex?: number;
  itemCount: number;
  onSelect?: (index: number) => void;
  disabled?: boolean;
};

export default function useKeyboardNavigation({
  vertical = true,
  horizontal = false,
  loopNavigation = true,
  initialIndex = -1,
  itemCount,
  onSelect,
  disabled = false,
}: KeyboardNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || itemCount === 0) return;

      let newIndex = activeIndex;
      let handled = false;

      // Handle vertical navigation
      if (vertical) {
        if (event.key === 'ArrowDown') {
          newIndex = activeIndex < itemCount - 1 ? activeIndex + 1 : loopNavigation ? 0 : activeIndex;
          handled = true;
        } else if (event.key === 'ArrowUp') {
          newIndex = activeIndex > 0 ? activeIndex - 1 : loopNavigation ? itemCount - 1 : activeIndex;
          handled = true;
        }
      }

      // Handle horizontal navigation
      if (horizontal) {
        if (event.key === 'ArrowRight') {
          newIndex = activeIndex < itemCount - 1 ? activeIndex + 1 : loopNavigation ? 0 : activeIndex;
          handled = true;
        } else if (event.key === 'ArrowLeft') {
          newIndex = activeIndex > 0 ? activeIndex - 1 : loopNavigation ? itemCount - 1 : activeIndex;
          handled = true;
        }
      }

      // Handle Home and End keys
      if (event.key === 'Home') {
        newIndex = 0;
        handled = true;
      } else if (event.key === 'End') {
        newIndex = itemCount - 1;
        handled = true;
      }

      // Handle Enter or Space to select
      if ((event.key === 'Enter' || event.key === ' ') && activeIndex !== -1) {
        onSelect?.(activeIndex);
        handled = true;
      }

      if (handled) {
        event.preventDefault();
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, disabled, horizontal, itemCount, loopNavigation, onSelect, vertical]
  );

  // Reset active index if item count changes
  useEffect(() => {
    if (activeIndex >= itemCount) {
      setActiveIndex(itemCount > 0 ? 0 : -1);
    }
  }, [activeIndex, itemCount]);

  const setActive = useCallback((index: number) => {
    if (index >= -1 && index < itemCount) {
      setActiveIndex(index);
    }
  }, [itemCount]);

  return {
    activeIndex,
    setActive,
    handleKeyDown,
  };
}
