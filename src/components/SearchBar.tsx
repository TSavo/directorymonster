'use client';

import React from 'react';
import { SearchBarContainer } from './SearchBarContainer';

interface SearchBarProps {
  siteId: string;
  placeholder?: string;
  className?: string;
  buttonLabel?: React.ReactNode;
}

/**
 * SearchBar Component
 *
 * This component provides a search bar that navigates to the search page
 * with the entered query. It has been refactored to use a container/presentation
 * pattern for better testability.
 */
export default function SearchBar({ siteId, placeholder, className, buttonLabel }: SearchBarProps) {
  return (
    <SearchBarContainer
      siteId={siteId}
      placeholder={placeholder}
      className={className}
      buttonLabel={buttonLabel}
    />
  );
}
