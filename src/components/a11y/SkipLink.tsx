'use client';

import React, { useState } from 'react';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export default function SkipLink({ 
  targetId, 
  label = 'Skip to main content' 
}: SkipLinkProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      // Reset tabIndex after focus
      setTimeout(() => {
        if (target) target.tabIndex = 0;
      }, 100);
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`
        fixed top-0 left-0 z-50 p-3 bg-primary-600 text-white font-medium
        transition-transform duration-200 rounded-br-md
        ${isFocused ? 'translate-y-0' : '-translate-y-full'}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      `}
      data-testid="skip-link"
    >
      {label}
    </a>
  );
}
