'use client';

import React, { useEffect, useState } from 'react';

type LiveRegionProps = {
  message: string;
  assertive?: boolean;
  clearAfter?: number; // Time in milliseconds
  className?: string;
};

export default function LiveRegion({
  message,
  assertive = false,
  clearAfter = 5000,
  className = '',
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    // Clear the message after the specified time
    if (clearAfter > 0 && message) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`sr-only ${className}`}
      data-testid="live-region"
    >
      {currentMessage}
    </div>
  );
}
